// Crea una respuesta simulada de Express para poder verificar status y JSON sin montar un servidor.
const createMockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

//Construye un cultivo falso con los campos que el controller usa en cada flujo.
const createCultivoMock = (overrides = {}) =>({
    id : 1,
    nombre: 'Maiz',
    tipo: 'Leguminosa',
    area: 100,
    unidad: 'hectareas',
    ubicacion: 'Sector A',
    fechaSiembra: '2024-01-01',
    fechaCosechaEstimada: '2024-06-01',
    estado: 'siembra',
    rendimiento: 50,
    ...overrides,
})