<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Einladung zum Adoption Manager</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50;">Willkommen beim Adoption Manager</h1>

    <p>Sie wurden eingeladen, dem Adoption Manager beizutreten.</p>

    <p>Um Ihr Konto zu aktivieren, klicken Sie bitte auf den folgenden Link und setzen Sie Ihr Passwort:</p>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $invitationUrl }}"
           style="background-color: #3490dc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Einladung annehmen
        </a>
    </div>

    <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
    <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 4px;">
        {{ $invitationUrl }}
    </p>

    <p style="color: #e74c3c; font-weight: bold;">
        Dieser Link läuft am {{ $expiresAt->format('d.m.Y H:i') }} Uhr ab.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
        Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
    </p>
</body>
</html>
