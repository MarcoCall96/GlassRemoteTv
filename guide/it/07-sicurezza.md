# 7. Sicurezza e privacy

> English: [../07-security.md](../07-security.md)

## Cosa GlassRemote non fa

- Nessun account, nessun accesso, nessuna pubblicità, nessuna analisi dei dati, nessun tracciamento, nessun cloud.
- Nessun dato viene inviato a un server. App e ricevitore parlano tra loro e con la TV solo dentro la tua rete di casa.

## Cosa devi fare tu

1. **Non aprire porte sul router** per il ricevitore (niente port forwarding, niente DMZ). Non esporlo mai a Internet.
2. Tieni **UPnP** spento sul router se non ti serve, così nulla apre porte da solo.
3. Esegui il ricevitore solo su un computer di cui ti fidi, nella tua rete **di casa**.
4. Proteggi `receiver/bridge-data/`: `cert.pem` e `key.pem` sono l'identità di cui la TV si fida. Chi li ottiene nella tua rete può comandare la TV. Sono nel `.gitignore`; non caricarli mai, non allegarli a una issue.
5. Non usare il ricevitore su Wi-Fi pubblici (bar, hotel, uffici) che non controlli.
6. Se usi un computer di lavoro, chiedi prima al reparto IT. Non cambiare le impostazioni del firewall di dispositivi che non sono tuoi.

## Come si protegge il ricevitore

- Per default ascolta solo su `127.0.0.1`. Per far entrare il telefono serve `--lan`.
- Anche con `--lan`, un middleware accetta solo client con indirizzo **privato (RFC 1918) o di loopback**. Le richieste da IP pubblici ricevono un errore.
- Gli endpoint di comando esistono solo nella rete locale; non c'è un livello di autenticazione, quindi considera chiunque sia sul tuo Wi-Fi capace di comandare la TV. Non usarlo su una rete condivisa con sconosciuti.

## Se pubblichi un fork o degli screenshot

Rimuovi prima: indirizzi IP e MAC, nomi delle TV, nomi del Wi-Fi, nomi di computer o utente nei percorsi, `bridge-data/`, log. Sostituiscili con segnaposto come `192.168.x.x`.

## Segnalare una vulnerabilità

Apri un advisory di sicurezza privato su GitHub (*Security, Report a vulnerability*) invece di una issue pubblica.
