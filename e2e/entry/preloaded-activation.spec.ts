import { expect, test } from "@playwright/test";

test("valida la invitación, confirma datos y términos, adjunta ambos documentos y muestra el estado del correo", async ({ page }) => {
  await page.route("**/api/auth/preloaded-activation/validate", (route) => route.fulfill({
    json: {
      cedula: "12345678",
      correo: "invitado@example.test",
      nombre: "\u200cDaysbel Katerine",
      apellido: "Alfonzo Rojas",
      telefono: "04141234567",
      estado: "VALIDADA",
      correoActivacion: null,
    },
  }));
  let submitBody = "";
  let submitContentType = "";
  await page.route("**/api/auth/preloaded-activation/submit", async (route) => {
    submitBody = route.request().postData() ?? "";
    submitContentType = route.request().headers()["content-type"] ?? "";
    await route.fulfill({ status: 201, json: { correoActivacion: "ENVIADO" } });
  });

  await page.goto("/activate");
  await page.getByRole("textbox", { name: "Cédula de identidad" }).fill("12345678");
  await page.getByRole("textbox", { name: "Correo de la invitación" }).fill("invitado@example.test");
  await page.getByRole("button", { name: "Validar invitación" }).click();

  await expect(page.getByRole("heading", { name: "Verifica tus datos" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Cédula de identidad" })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Correo electrónico" })).toBeDisabled();
  await expect(page.locator('input[name="nombre"]')).toHaveValue("Daysbel Katerine");
  await expect(page.locator('input[name="apellido"]')).toHaveValue("Alfonzo Rojas");
  await page.locator('input[name="telefono"]').fill("04125823664");
  const image = { name: "Fixed_Tilt_Solar_Panel_at_Canterbury_Market_Rooftop_Installation.png", mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71]) };
  await page.locator("#activation-document-cedula").setInputFiles(image);
  await page.locator("#activation-document-rif").setInputFiles({ ...image, name: "rif.png" });
  const replaceDocumentButton = page.locator('label[for="activation-document-cedula"]');
  await expect(replaceDocumentButton).toHaveCSS("white-space", "nowrap");
  expect((await replaceDocumentButton.boundingBox())?.height).toBeLessThan(50);
  await page.getByRole("checkbox", { name: "Confirmo que mis datos son correctos." }).check();
  await page.getByRole("button", { name: "Leer términos y condiciones" }).click();
  await expect(page.getByText(/Declaro y garantizo que los fondos que utilizaré provienen de actividades lícitas/)).toBeVisible();
  await page.getByRole("button", { name: "Cerrar" }).click();
  await page.getByRole("checkbox", { name: /Acepto los términos de activación/ }).check();
  await page.getByRole("button", { name: "Enviar documentos y continuar" }).click();

  await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();
  await expect(page.getByText("Tu cuenta quedará activa cuando completes el enlace y accedas con tu contraseña.")).toBeVisible();
  expect(submitContentType).toContain("multipart/form-data");
  expect(submitBody).toContain("datosConfirmados");
  expect(submitBody).toContain("terminosAceptados");
  expect(submitBody).toContain("documentoCedula");
  expect(submitBody).toContain("documentoRif");
  expect(submitBody).not.toContain("\u200c");
  expect(submitBody).not.toContain("token");
  expect(submitBody).not.toContain("correo");
});
