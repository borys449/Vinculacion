const { obtenerMiFinca, actualizarPerimetro } = require('../controllers/fincaController');
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
