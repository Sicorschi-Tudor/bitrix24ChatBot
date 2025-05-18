// Importăm modulele necesare
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import 'dotenv/config';

// Inițializăm aplicația Express
const app = express();

// Configurăm middleware-ul pentru parsarea JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Definim portul pe care va rula serverul
const PORT = process.env.PORT || 3000;

// Endpoint pentru primirea mesajelor de la Bitrix24
app.post('/bitrex', async (req, res) => {
  try {
    console.log('Eveniment de mesaj nou primit:', req.body);
  // Verificăm dacă avem datele necesare în noua structură
if (!req.body || !req.body.data || !req.body.data.PARAMS || !req.body.data.PARAMS.MESSAGE) {
    console.error('Date lipsă în request');
    return res.status(400).json({ success: false, error: 'Date invalide' });
  }
  
  // Extragem informațiile necesare din noua structură
  const dialogId = req.body.data.PARAMS.DIALOG_ID || req.body.data.PARAMS.TO_CHAT_ID;
  const originalMessage = req.body.data.PARAMS.MESSAGE;
  
    
    // Răspundem imediat pentru a evita timeout-ul de la Bitrix24
    res.status(200).json({ success: true });
    
    // Modificăm mesajul primit
    const modifiedMessage = originalMessage + " text editat de bot";
    
 // Trimitem mesajul modificat înapoi în Bitrix24
await sendMessageToBitrix(dialogId, modifiedMessage, req.body.auth);
    
    console.log(`Răspuns trimis pentru dialogul ${dialogId}`);
    
  } catch (error) {
    console.error('Eroare la procesarea mesajului:', error.message);
    // Răspundem cu succes chiar și în caz de eroare pentru a evita retrimiteri
    if (!res.headersSent) {
      res.status(200).json({ success: true });
    }
  }
});

// Funcție pentru trimiterea mesajului înapoi în Bitrix24
async function sendMessageToBitrix(dialogId, message, authData) {
    try {
      // URL-ul webhook-ului Bitrix24
      const webhookUrl = process.env.BITRIX_WEBHOOK_URL;
      
      // ID-ul botului
      const botId = process.env.BOT_ID;
      
      // CLIENT_ID pentru autentificare în modul Webhook
      const clientId = process.env.CLIENT_ID || (authData && authData.application_token);
      
      if (!botId) {
        throw new Error('BOT_ID lipsă în variabilele de mediu');
      }

      
      // Construim URL-ul complet cu extensia .json și parametrii în query string
      const url = `${webhookUrl}/imbot.message.add.json?BOT_ID=${botId}&CLIENT_ID=${clientId}&DIALOG_ID=${dialogId}&MESSAGE=${encodeURIComponent(message)}`;
      
      console.log('Trimitere mesaj către Bitrix24 URL:', url);
      
      // Trimitem cererea GET către Bitrix24
      const response = await axios.get(url);
      
      console.log('Răspuns de la Bitrix24:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Eroare la trimiterea mesajului către Bitrix24:', error.message);
      throw error;
    }
  }
  
  
// Rută de verificare a stării
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Pornire server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
  console.log('Așteptare mesaje de la Bitrix24...');
});
