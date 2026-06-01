import os


APP_NAME = os.getenv("APP_NAME", "RifaApp")


SUBJECTS = {
    "CustomMessage_SignUp": f"Confirma tu correo en {APP_NAME}",
    "CustomMessage_ResendCode": f"Tu nuevo codigo de {APP_NAME}",
    "CustomMessage_ForgotPassword": f"Recupera tu acceso a {APP_NAME}",
    "CustomMessage_UpdateUserAttribute": f"Confirma tu nuevo correo en {APP_NAME}",
    "CustomMessage_VerifyUserAttribute": f"Verifica tu correo en {APP_NAME}",
}

TITLES = {
    "CustomMessage_SignUp": "Confirma tu correo",
    "CustomMessage_ResendCode": "Tu nuevo codigo",
    "CustomMessage_ForgotPassword": "Recupera tu acceso",
    "CustomMessage_UpdateUserAttribute": "Confirma tu nuevo correo",
    "CustomMessage_VerifyUserAttribute": "Verifica tu correo",
}

BODY_COPY = {
    "CustomMessage_SignUp": "Usa este codigo para activar tu cuenta y empezar a comprar o crear rifas.",
    "CustomMessage_ResendCode": "Te enviamos un nuevo codigo para completar la verificacion de tu cuenta.",
    "CustomMessage_ForgotPassword": "Usa este codigo para crear una nueva contrasena de forma segura.",
    "CustomMessage_UpdateUserAttribute": "Usa este codigo para confirmar el cambio de correo de tu cuenta.",
    "CustomMessage_VerifyUserAttribute": "Usa este codigo para verificar tu correo.",
}


def _html_message(trigger_source: str, code: str) -> str:
    title = TITLES.get(trigger_source, "Codigo de seguridad")
    body = BODY_COPY.get(trigger_source, "Usa este codigo para continuar con tu cuenta.")
    return f"""<!doctype html>
<html>
  <body style="margin:0;background:#F6F1EA;font-family:Manrope,Arial,sans-serif;color:#1C1F26;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F6F1EA;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#FFFCF8;border:1px solid #E6E1D8;border-radius:16px;box-shadow:0 8px 32px rgba(18,22,33,0.06);overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="width:44px;height:44px;border-radius:16px;background:#F36B4F;color:#ffffff;text-align:center;line-height:44px;font-weight:800;font-size:20px;">R</td>
                    <td style="padding-left:14px;">
                      <div style="font-size:17px;font-weight:800;line-height:1.1;">{APP_NAME}</div>
                      <div style="font-size:12px;color:#6F7682;font-weight:600;">Rifas simples y seguras</div>
                    </td>
                  </tr>
                </table>
                <h1 style="font-size:24px;line-height:1.25;margin:28px 0 8px;font-weight:800;color:#1C1F26;">{title}</h1>
                <p style="margin:0;color:#6F7682;font-size:15px;line-height:1.6;">{body}</p>
                <div style="margin:24px 0;padding:18px;border-radius:14px;background:#FFF7EE;border:1px solid #FAD6C8;text-align:center;font-size:28px;font-weight:800;color:#D9563D;letter-spacing:4px;">
                  {code}
                </div>
                <p style="margin:0;color:#6F7682;font-size:13px;line-height:1.6;">Si no solicitaste este correo, puedes ignorarlo. Tu cuenta seguira protegida.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def handler(event, _context):
    trigger_source = event.get("triggerSource", "")
    code = event.get("request", {}).get("codeParameter", "{####}")
    event["response"]["emailSubject"] = SUBJECTS.get(trigger_source, f"Codigo de seguridad de {APP_NAME}")
    event["response"]["emailMessage"] = _html_message(trigger_source, code)
    return event
