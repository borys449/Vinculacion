const { obtenerMiFinca, actualizarPerimetro, eliminarMapaCompleto } = require('../controllers/fincaController');
const { obtenerLotes, crearLote, actualizarLote, eliminarLote } = require('../controllers/loteController');
const { Finca, Lote, Registro, Cultivo, Ganado } = require('../models');

describe('Fincas & Lotes Controller & Rules', () => {
  let req, res;

  beforeEach(() => {
    req = {
      usuario: {
        id: 1,
        nombre: 'Lionel Messi',
        tipo: 'administrador',
        area: 'administracion',
        fincaId: 1
      },
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('Finca Controller', () => {
    test('actualizarPerimetro rechaza si no es administrador', async () => {
      req.usuario.tipo = 'trabajador';
      req.usuario.area = 'cultivos';
      req.body = { poligonoPerimetro: { type: 'Feature' } };

      await actualizarPerimetro(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Solo el Administrador')
      }));
    });

    test('actualizarPerimetro actualiza correctamente si es administrador', async () => {
      const mockFinca = {
        id: 1,
        nombre: 'Finca Lodana',
        update: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Finca, 'findByPk').mockResolvedValue(mockFinca);
      jest.spyOn(Registro, 'create').mockResolvedValue({});

      req.body = {
        poligonoPerimetro: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] } }
      };

      await actualizarPerimetro(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockFinca.update).toHaveBeenCalled();
      expect(Registro.create).toHaveBeenCalledWith(expect.objectContaining({
        categoria: 'Actualización de Perímetro'
      }));
    });

    test('eliminarMapaCompleto elimina perimetro y lotes asociados correctamente', async () => {
      const mockFinca = {
        id: 1,
        nombre: 'Finca Lodana',
        update: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Finca, 'findByPk').mockResolvedValue(mockFinca);
      jest.spyOn(Lote, 'findAll').mockResolvedValue([{ id: 10 }, { id: 11 }]);
      jest.spyOn(Cultivo, 'update').mockResolvedValue([1]);
      jest.spyOn(Ganado, 'update').mockResolvedValue([1]);
      jest.spyOn(Lote, 'destroy').mockResolvedValue(2);
      jest.spyOn(Registro, 'create').mockResolvedValue({});

      await eliminarMapaCompleto(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Cultivo.update).toHaveBeenCalled();
      expect(Ganado.update).toHaveBeenCalled();
      expect(Lote.destroy).toHaveBeenCalledWith({ where: { fincaId: 1 } });
      expect(mockFinca.update).toHaveBeenCalledWith({ poligonoPerimetro: null });
      expect(Registro.create).toHaveBeenCalledWith(expect.objectContaining({
        categoria: 'Reinicio de Mapa'
      }));
    });
  });

  describe('Lote Controller & Branch Management Rules', () => {
    test('rechaza a un agricultor creando lote de ganadería', async () => {
      req.usuario.tipo = 'trabajador';
      req.usuario.area = 'cultivos';
      req.body = {
        nombre: 'Lote Pasto 1',
        tipo: 'ganaderia',
        geometria: { type: 'Feature' }
      };

      await crearLote(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('no tiene permisos para crear lotes de ganaderia')
      }));
    });

    test('rechaza a un ganadero creando lote de agricultura', async () => {
      req.usuario.tipo = 'trabajador';
      req.usuario.area = 'ganaderia';
      req.body = {
        nombre: 'Lote Maiz 1',
        tipo: 'agricultura',
        geometria: { type: 'Feature' }
      };

      await crearLote(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('no tiene permisos para crear lotes de agricultura')
      }));
    });

    test('permite a un agricultor crear lote de agricultura y registra en bitácora', async () => {
      req.usuario.tipo = 'trabajador';
      req.usuario.area = 'cultivos';
      req.body = {
        nombre: 'Lote Cacao 1',
        tipo: 'agricultura',
        geometria: { type: 'Feature' }
      };

      const mockLoteCreado = {
        id: 10,
        nombre: 'Lote Cacao 1',
        tipo: 'agricultura',
        fincaId: 1
      };
      jest.spyOn(Finca, 'findByPk').mockResolvedValue({ id: 1, poligonoPerimetro: null });
      jest.spyOn(Lote, 'findAll').mockResolvedValue([]);
      jest.spyOn(Lote, 'create').mockResolvedValue(mockLoteCreado);
      jest.spyOn(Registro, 'create').mockResolvedValue({});

      await crearLote(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Registro.create).toHaveBeenCalledWith(expect.objectContaining({
        tipo: 'lote',
        categoria: 'Creación de Lote',
        descripcion: expect.stringContaining('creó el lote \'Lote Cacao 1\'')
      }));
    });

    test('adapta y crea un lote que rebasa el perímetro de la finca corrigiéndolo al borde', async () => {
      req.usuario.tipo = 'trabajador';
      req.usuario.area = 'cultivos';

      // Finca entre 0,0 y 10,10
      const fincaPerimetro = {
        type: 'Polygon',
        coordinates: [
          [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
        ]
      };

      // Lote con vértices que se salen a (12, 5) y (12, 8)
      const loteParcialmenteFuera = {
        type: 'Polygon',
        coordinates: [
          [[5, 5], [12, 5], [12, 8], [5, 8], [5, 5]]
        ]
      };

      req.body = {
        nombre: 'Lote Borde Adaptado',
        tipo: 'agricultura',
        geometria: loteParcialmenteFuera
      };

      jest.spyOn(Finca, 'findByPk').mockResolvedValue({ id: 1, poligonoPerimetro: fincaPerimetro });
      jest.spyOn(Lote, 'findAll').mockResolvedValue([]);
      jest.spyOn(Lote, 'create').mockImplementation((data) => Promise.resolve({ id: 99, ...data }));
      jest.spyOn(Registro, 'create').mockResolvedValue({});

      await crearLote(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Lote.create).toHaveBeenCalledWith(expect.objectContaining({
        nombre: 'Lote Borde Adaptado',
        geometria: expect.objectContaining({
          geometry: expect.objectContaining({
            type: 'Polygon'
          })
        })
      }));
    });

    test('adapta y alinea un lote que toca o invade otro lote existente sin bloquearse', async () => {
      req.usuario.tipo = 'trabajador';
      req.usuario.area = 'cultivos';

      const fincaPerimetro = {
        type: 'Polygon',
        coordinates: [
          [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
        ]
      };

      const loteExistente = {
        id: 1,
        nombre: 'Lote Pasto 1',
        tipo: 'ganaderia',
        geometria: {
          type: 'Polygon',
          coordinates: [
            [[1, 1], [5, 1], [5, 5], [1, 5], [1, 1]]
          ]
        }
      };

      // Nuevo lote con solapamiento parcial (2,2 a 6,6)
      const nuevoLoteSolapado = {
        type: 'Polygon',
        coordinates: [
          [[2, 2], [6, 2], [6, 6], [2, 6], [2, 2]]
        ]
      };

      req.body = {
        nombre: 'Lote Maiz Alineado',
        tipo: 'agricultura',
        geometria: nuevoLoteSolapado
      };

      jest.spyOn(Finca, 'findByPk').mockResolvedValue({ id: 1, poligonoPerimetro: fincaPerimetro });
      jest.spyOn(Lote, 'findAll').mockResolvedValue([loteExistente]);
      jest.spyOn(Lote, 'create').mockImplementation((data) => Promise.resolve({ id: 100, ...data }));
      jest.spyOn(Registro, 'create').mockResolvedValue({});

      await crearLote(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Lote.create).toHaveBeenCalled();
    });

    test('eliminarLote desvincula cultivos y ganado asociados y elimina el lote correctamente', async () => {
      req.params = { id: 2 };
      const mockLote = {
        id: 2,
        nombre: 'Lote Ganadero Lodana 1',
        tipo: 'ganaderia',
        fincaId: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Lote, 'findOne').mockResolvedValue(mockLote);
      jest.spyOn(Cultivo, 'update').mockResolvedValue([1]);
      jest.spyOn(Ganado, 'update').mockResolvedValue([1]);
      jest.spyOn(Registro, 'update').mockResolvedValue([1]);
      jest.spyOn(Registro, 'create').mockResolvedValue({});

      await eliminarLote(req, res);

      expect(Cultivo.update).toHaveBeenCalledWith({ loteId: null }, { where: { loteId: 2 } });
      expect(Ganado.update).toHaveBeenCalledWith({ loteId: null }, { where: { loteId: 2 } });
      expect(mockLote.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(Registro.create).toHaveBeenCalledWith(expect.objectContaining({
        tipo: 'lote',
        categoria: 'Eliminación de Lote'
      }));
    });
  });
});
