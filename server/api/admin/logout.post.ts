export default defineAdminHandler(async (event) => {
  await destroyAdminSession(event);
  return { ok: true };
});
