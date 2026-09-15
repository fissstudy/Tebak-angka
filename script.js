import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    update,
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

                percobaan: 0

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

            percobaan: 0

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
            "👤 " + player.nama;

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

    if (giliranPemain !== idPemain) {

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


    const roomRef =
        ref(
            db,
            "rooms/" + kodeRoomSekarang
        );


    const snapshot =
        await get(roomRef);


    if (!snapshot.exists()) {
        return;
    }


    const data =
        snapshot.val();


    let percobaan =
        (data.pemain[idPemain]?.percobaan || 0) + 1;


    if (tebakan === data.angkaRahasia) {

        await update(roomRef, {

            status: "selesai",

            pemenang: namaPemain,

            ["pemain/" + idPemain + "/percobaan"]:
                percobaan

        });


        document.getElementById("pemenang").innerText =
            "🏆 " +
            namaPemain +
            " menang!";

        return;
    }


    let daftarPemain =
        Object.keys(data.pemain);


    let posisi =
        daftarPemain.indexOf(idPemain);


    let pemainBerikutnya =
        daftarPemain[
            (posisi + 1) %
            daftarPemain.length
        ];


    let petunjuk =
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
}


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

window.keluarRoom = function() {

    location.reload();

};