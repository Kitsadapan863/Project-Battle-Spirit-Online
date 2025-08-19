// battle-spirits-server/migrate-cards.js
const admin = require('firebase-admin');
const { playerCards } = require('./game_logic/playerDeck.js');
const { redCards } = require('./game_logic/redDeck.js');
const { greenCards } = require('./game_logic/greenDeck.js')

// **สำคัญ:** แก้ 'path/to/your/serviceAccountKey.json' ให้เป็นชื่อไฟล์ที่คุณดาวน์โหลดมา
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const cardsCollection = db.collection('cards');

async function uploadCards() {
    console.log('Starting card migration...');

    const allCards = [...playerCards, ...redCards, ...greenCards];
    const uniqueCards = allCards.reduce((acc, current) => {
        if (!acc.find(item => item.id === current.id)) {
            acc.push(current);
        }
        return acc;
    }, []);

    const batch = db.batch();

    uniqueCards.forEach(card => {
        // ใช้ card.id เป็น Document ID
        const docRef = cardsCollection.doc(card.id); 
        // ไม่ต้องเก็บ quantity ในฐานข้อมูลหลัก
        // const { quantity, ...cardData } = card; 
        const cardData = card;
        batch.set(docRef, cardData);
    });

    await batch.commit();
    console.log(`Successfully uploaded ${uniqueCards.length} unique cards to Firestore!`);
}

uploadCards().catch(console.error);