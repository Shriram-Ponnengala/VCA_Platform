const { AuthService } = require('./apps/api/src/modules/auth/auth.service');
async function test() {
  const service = new AuthService();
  try {
    const res = await service.login('admin', 'admin123');
    console.log("LOGIN SUCCESS", res);
  } catch (e) {
    console.error("LOGIN FAIL", e);
  }
}
test();
