const { connectDB, sequelize } = require('./config/db');

async function test() {
  try {
    await connectDB();
    console.log('Connect success');
    await sequelize.sync({ alter: true });
    console.log('Sync success');
  } catch(e) {
    console.error('Caught error: ', e.message);
  }
}
test();
