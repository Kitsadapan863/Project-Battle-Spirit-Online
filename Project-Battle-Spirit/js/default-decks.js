// Project-Battle-Spirit/js/default-decks.js

// ข้อมูลเด็คเริ่มต้นจะถูกเก็บในรูปแบบเดียวกับที่บันทึกใน localStorage
// คือ { cardId: quantity }

const blueDeck = {
    'card-rock-golem': 3,
    'card-castle-golem': 3,
    'card-giantHero-titus': 3,
    'card-steam-golem': 1,
    'card-clawSword-lazarus': 3,
    'card-stone-statue': 3,
    'card-two-sword-ambrose': 3,
    'card-soldier-gustav': 3,
    'card-battlebeast-bulltop': 3,
    'card-blasting-giant-douglas': 3,
    'card-giantemperor-alexander': 3, // หมายเหตุ: ในไฟล์เดิมคุณใส่ 20 ซึ่งเกิน 40 ใบ
    'magic-strong-draw': 3,
    'magic-hammer': 2,
    'magic-blitz': 2,
    'magic-construction': 2, // ปรับจำนวนเพื่อให้เด็คครบ 40 ใบ
};

const redDeck = {
    'card-rokceratops': 3,
    'card-lizardedge': 3,
    'card-goradon': 3,
    'card-rainydle': 3,
    'card-dinonychusaw': 3,
    'card-ovirapt': 1,
    'card-wingDragman-pteradia': 3,
    'card-horngrizzly': 3,
    'card-sabecaulus': 3,
    'card-siegwurm': 3,
    'card-meteorwurm': 3,
    'magic-double-draw': 2,
    'magic-big-bang-energy': 3,
    'magic-buster-javelin': 1,
    'magic-extra-draw': 3,
};


export const defaultDecks = [
    {
        name: 'Default Blue Deck',
        cards: blueDeck
    },
    {
        name: 'Default Red Deck',
        cards: redDeck
    }
];