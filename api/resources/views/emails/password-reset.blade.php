<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Passwort zurücksetzen</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50;">Passwort zurücksetzen</h1>

    <p>Sie erhalten diese E-Mail, weil für Ihr Konto ein neues Passwort angefordert wurde.</p>

    <p>Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:</p>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $resetUrl }}"
           style="background-color: #3490dc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Passwort zurücksetzen
        </a>
    </div>

    <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
    <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 4px;">
        {{ $resetUrl }}
    </p>

    <p style="color: #e74c3c; font-weight: bold;">
        Dieser Link läuft in {{ $expiresInMinutes }} Minuten ab.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
        Wenn Sie kein neues Passwort angefordert haben, können Sie diese E-Mail ignorieren.
        Ihr Passwort bleibt unverändert.
    </p>
</body>
</html>
