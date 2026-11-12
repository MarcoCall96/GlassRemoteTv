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
- Le pagine web non possono comandare il ricevitore: rifiuta le richieste il cui Host non è un indirizzo IP privato o localhost, le richieste con un Origin estraneo e quelle che il browser segnala come cross-site.
- Gli endpoint di comando esistono solo nella rete locale; il ricevitore su computer non ha un livello di autenticazione, quindi considera chiunque sia sul tuo Wi-Fi capace di comandare la TV. Non usarlo su una rete condivisa con sconosciuti.

## L'app TV (GlassRemoteTv): debug di rete e PIN

L'app TV preme i tasti del telecomando tramite il debug di Android (ADB) sull'indirizzo interno della TV. Per questo il **debug di rete** deve essere acceso (Impostazioni, Preferenze dispositivo, Opzioni sviluppatore). Da sapere:

- Un dispositivo che vuole usare ADB sulla TV deve essere approvato sullo schermo della TV. Spuntando *Consenti sempre da questo computer* diventa attendibile per sempre. GlassRemoteTv si approva una volta e poi resta attendibile.
- Con il debug di rete acceso, qualsiasi computer della tua Wi-Fi che approvi sullo schermo della TV ottiene un controllo profondo della TV. Non approvare richieste che non riconosci.
- Puoi spegnerlo quando vuoi. Il telecomando smette di funzionare finché non lo riaccendi. *Revoca autorizzazioni debug USB* nelle Opzioni sviluppatore toglie ogni dispositivo attendibile.
- GlassRemoteTv è protetta da un **PIN di 6 cifre**, mostrato sulla TV e dentro il codice QR. Il telefono lo scrive (o inquadra il QR) una volta e riceve un lungo codice casuale che conserva. Senza un codice valido l'app TV ignora ogni comando. Il blocco del PIN è per indirizzo del client: 5 tentativi sbagliati bloccano quell'indirizzo per 1 minuto, raddoppiando a ogni giro fino a 15 minuti; dopo 30 tentativi sbagliati in totale l'app TV sceglie da sola un PIN nuovo (lo schermo della TV e il codice QR si aggiornano). La porta è casuale per ogni installazione, non un numero fisso e noto.
- Il traffico nella rete di casa non è cifrato (HTTP semplice), quindi non usarla su Wi-Fi di cui non ti fidi. Un ospite sul tuo Wi-Fi può usare la TV solo se vede il PIN o il codice QR sullo schermo della TV.
- Il PIN resta lo stesso finché non cancelli i dati dell'app. Per averne uno nuovo cancella i dati dell'app nelle impostazioni di Android (si tolgono anche tutti i telefoni autorizzati).

## Se pubblichi un fork o degli screenshot

Rimuovi prima: indirizzi IP e MAC, nomi delle TV, nomi del Wi-Fi, nomi di computer o utente nei percorsi, `bridge-data/`, log. Sostituiscili con segnaposto come `192.168.x.x`.

## Segnalare una vulnerabilità

Apri un advisory di sicurezza privato su GitHub (*Security, Report a vulnerability*) invece di una issue pubblica.
