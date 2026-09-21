const { Usuario } = require('./models'); // Ajusta la ruta a tus modelos si varía

async function reset() {
  try {
    const usuario = await Usuario.findOne({ where: { email: 'elkincanto999@gmail.com' } });
    if (!usuario) {
      console.log('Usuario no encontrado');
      return;
    }
    
    // Asignar y guardar (esto dispara los hooks/encriptación del modelo)
    usuario.password = 'admin123';
    await usuario.save();
    
    console.log('✅ Contraseña restablecida correctamente con la lógica del backend');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit();
  }
}

reset();