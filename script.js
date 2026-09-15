import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================
   FIREBASE CONFIG
   =========================
   
   TEMPEL CONFIG FIREBASE
   KAMU DI SINI
*/

const firebaseConfig = {
  apiKey: "AIzaSyA2gwDA7YzBfbEmPuVyZRJLsXosLbwVlwA",
  authDomain: "tebak-aja.firebaseapp.com",
  databaseURL: "https://tebak-aja-default-rtdb.firebaseio.com",
  projectId: "tebak-aja",
  storageBucket: "tebak-aja.firebasestorage.app",
  messagingSenderId: "609224558683",
  appId: "1:609224558683:web:2d9b7d7fbac769edda977e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


/* =========================
   DATA PEMAIN
========================= */

let namaPemain = "";
let kodeRoomSekarang = "";
let idPemain = "";

let angkaRahasia = 0;
let giliranPemain = "";


/* =========================
   BUAT ID PEMAIN
========================= */

function buatIdPemain() {

    return "pemain_" +
        Date.now() +
        "_" +
        Math.floor(Math.random() * 1000);
}


/* =========================
   KODE ROOM
========================= */

function buatKodeRoom() {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();
}


/* =========================
   BUAT ROOM
========================= */

window.buatRoom = async function() {

    namaPemain =
        document.getElementById("nama").value.trim();

    if (namaPemain === "") {

        document.getElementById("statusRoom").innerText =
            "Masukkan nama dulu!";

        return;
    }


    idPemain = buatIdPemain();

    kodeRoomSekarang = buatKodeRoom();


    angkaRahasia =
        Math.floor(Math.random() * 100) + 1;


    const roomRef =
        ref(
            db,
            "rooms/" + kodeRoomSekarang
        );


    await set(roomRef, {

        angkaRahasia: angkaRahasia,

        status: "menunggu",

        giliran: idPemain,

        percobaan: 0,

pemain: {
    [idPemain]: {
        nama: namaPemain,
        percobaan: 0,
        skor: 0
    }
        }

    });


    masukTampilanRoom();

    pantauRoom();
};


/* =========================
   GABUNG ROOM
========================= */

window.gabungRoom = async function() {

    namaPemain =
        document.getElementById("nama").value.trim();

    const kode =
        document
            .getElementById("kodeRoom")
            .value
            .trim();


    if (namaPemain === "") {

        document.getElementById("statusRoom").innerText =
            "Masukkan nama dulu!";

        return;
    }


    if (kode === "") {

        document.getElementById("statusRoom").innerText =
            "Masukkan kode room!";

        return;
    }


    const roomRef =
        ref(
            db,
            "rooms/" + kode
        );


    const snapshot =
        await get(roomRef);


    if (!snapshot.exists()) {

        document.getElementById("statusRoom").innerText =
            "Room tidak ditemukan!";

        return;
    }


    idPemain = buatIdPemain();

    kodeRoomSekarang = kode;


    await update(roomRef, {

        ["pemain/" + idPemain]: {
    nama: namaPemain,
    percobaan: 0,
    skor: 0
        },

        status: "bermain"

    });


    masukTampilanRoom();

    pantauRoom();
};


/* =========================
   TAMPILAN ROOM
========================= */

function masukTampilanRoom() {

    document.getElementById("menuRoom").style.display =
        "none";

    document.getElementById("ruangTunggu").style.display =
        "block";

    document.getElementById("tampilKode").innerText =
        kodeRoomSekarang;
}


/* =========================
   PANTAU ROOM
========================= */

function pantauRoom() {
    const roomRef = ref(
        db,
        "rooms/" + kodeRoomSekarang
    );

    onValue(roomRef, snapshot => {
        if (!snapshot.exists()) {
            return;
        }

        const data = snapshot.val();

        tampilkanPemain(data.pemain);

        if (data.status === "menunggu") {
            document.getElementById("statusGame").innerText =
                "Menunggu pemain lain...";

            document.getElementById("game").style.display =
                "none";

            return;
        }

        if (data.status === "bermain") {
            document.getElementById("statusGame").innerText =
                "Game dimulai!";

            document.getElementById("game").style.display =
                "block";

            giliranPemain = data.giliran;

            updateGiliran();

            if (data.petunjuk) {
                document.getElementById("petunjuk").innerText =
                    data.petunjuk;
            }

            if (data.pemain && data.pemain[idPemain]) {
                document.getElementById("percobaan").innerText =
                    data.pemain[idPemain].percobaan || 0;
            }

            return;
        }

        if (data.status === "selesai") {
            document.getElementById("statusGame").innerText =
                "🎮 Game selesai!";

            document.getElementById("game").style.display =
                "block";

            document.getElementById("giliran").innerText =
                "🏁 Permainan sudah selesai.";

            document.getElementById("petunjuk").innerText =
                "🎉 Ada pemenang!";

            tampilkanHasil(data);
        }
    });
}


/* =========================
   TAMPILKAN PEMAIN
========================= */

function tampilkanPemain(pemain) {

    const tempat =
        document.getElementById("daftarPemain");


    if (!pemain) {

        tempat.innerText =
            "Belum ada pemain.";

        return;
    }


    tempat.innerHTML = "";


    Object.values(pemain).forEach(player => {

        const div =
            document.createElement("div");

        div.innerText =
    "👤 " +
    player.nama +
    " — 🏆 " +
    (player.skor || 0) +
    " menang";

        tempat.appendChild(div);

    });
}


/* =========================
   GILIRAN
========================= */

function updateGiliran() {

    const teks =
        document.getElementById("giliran");


    if (giliranPemain === idPemain) {

        teks.innerText =
            "🎯 Giliran kamu!";

    } else {

        teks.innerText =
            "⏳ Menunggu giliran teman...";

    }
}


/* =========================
   KIRIM TEBAKAN
========================= */

window.kirimTebakan = async function() {

    const roomRef = ref(
        db,
        "rooms/" + kodeRoomSekarang
    );

    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        return;
    }

    const data = snapshot.val();

    // CEK GAME SUDAH SELESAI
    if (data.status === "selesai") {
        document.getElementById("petunjuk").innerText =
            "🏁 Game sudah selesai! Tekan Mulai Lagi.";
        return;
    }

    // CEK GILIRAN
    if (data.giliran !== idPemain) {
        document.getElementById("petunjuk").innerText =
            "⏳ Belum giliran kamu!";
        return;
    }

    const tebakan =
        Number(
            document
                .getElementById("tebakan")
                .value
        );

    if (
        !Number.isInteger(tebakan) ||
        tebakan < 1 ||
        tebakan > 100
    ) {
        document.getElementById("petunjuk").innerText =
            "Masukkan angka 1–100!";
        return;
    }

    const percobaan =
        (data.pemain[idPemain]?.percobaan || 0) + 1;

    // JIKA JAWABAN BENAR
    if (tebakan === data.angkaRahasia) {

        const skorBaru =
            (data.pemain[idPemain]?.skor || 0) + 1;

        await update(roomRef, {
            status: "selesai",
            pemenang: namaPemain,
            ["pemain/" + idPemain + "/percobaan"]:
                percobaan,
            ["pemain/" + idPemain + "/skor"]:
                skorBaru
        });

        return;
    }

    // JAWABAN SALAH
    const daftarPemain =
        Object.keys(data.pemain);

    const posisi =
        daftarPemain.indexOf(idPemain);

    const pemainBerikutnya =
        daftarPemain[
            (posisi + 1) % daftarPemain.length
        ];

    const petunjuk =
        tebakan < data.angkaRahasia
            ? "⬆️ Terlalu kecil!"
            : "⬇️ Terlalu besar!";

    await update(roomRef, {
        giliran: pemainBerikutnya,
        ["pemain/" + idPemain + "/percobaan"]:
            percobaan,
        petunjuk: petunjuk
    });

    document.getElementById("tebakan").value = "";
};

/* =========================
   HASIL GAME
========================= */

function tampilkanHasil(data) {

    if (data.status !== "selesai") {
        return;
    }


    document.getElementById("pemenang").innerText =
        "🏆 " +
        data.pemenang +
        " menang!";
}


/* =========================
   KELUAR ROOM
========================= */

window.keluarRoom = async function() {

    const roomRef = ref(
        db,
        "rooms/" + kodeRoomSekarang
    );

    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        location.reload();
        return;
    }

    const data = snapshot.val();
    const pemain = data.pemain || {};
    const daftarPemain = Object.keys(pemain);

    // Kalau ini pemain terakhir, hapus room
    if (daftarPemain.length <= 1) {
        await remove(roomRef);
        location.reload();
        return;
    }

    // Cari pemain yang akan keluar
    const posisiKeluar =
        daftarPemain.indexOf(idPemain);

    // Tentukan pemain berikutnya
    const pemainBerikutnya =
        daftarPemain[
            (posisiKeluar + 1) %
            daftarPemain.length
        ];

    // Hapus pemain dari database
    await remove(
        ref(
            db,
            "rooms/" +
            kodeRoomSekarang +
            "/pemain/" +
            idPemain
        )
    );

    // Kalau yang keluar sedang mendapat giliran,
    // pindahkan giliran ke pemain berikutnya
    if (data.giliran === idPemain) {
        await update(roomRef, {
            giliran: pemainBerikutnya
        });
    }

    // Kalau tersisa satu pemain,
    // kembalikan room ke status menunggu
    if (daftarPemain.length === 2) {
        await update(roomRef, {
            status: "menunggu",
            petunjuk: "⏳ Menunggu pemain lain..."
        });
    }

    location.reload();
};
window.mulaiLagi = async function() {
    const roomRef = ref(
        db,
        "rooms/" + kodeRoomSekarang
    );

    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        return;
    }

    const data = snapshot.val();

    const daftarPemain = Object.keys(data.pemain || {});

    if (daftarPemain.length < 2) {
        return;
    }

    const giliranPertama = daftarPemain[0];

    const pemainReset = {};

    daftarPemain.forEach(id => {
        pemainReset[id] = {
    nama: data.pemain[id].nama,
    percobaan: 0,
    skor: data.pemain[id].skor || 0
};
    });

    const angkaBaru =
        Math.floor(Math.random() * 100) + 1;

    await update(roomRef, {
        angkaRahasia: angkaBaru,
        status: "bermain",
        giliran: giliranPertama,
        percobaan: 0,
        petunjuk: "🎯 Tebak angka 1–100!",
        pemenang: null,
        pemain: pemainReset
    });

    document.getElementById("tebakan").value = "";
    document.getElementById("pemenang").innerText = "";
};