import os

file_path = "client/src/scenes/GameScene.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    'PERAN MANEH': 'PERAN KAMU',
    'Batur Sanekala (Ngan maneh anu bisa ningali ieu)': 'Teman Sanekala (Hanya kamu yang bisa melihat ini)',
    'Tilar': 'Mati',
    'Kebal geus dipake': 'Kebal sudah terpakai',
    'Geus dipake': 'Sudah terpakai',
    'ngahalangan aksi maneh senja ieu': 'menghalangi aksimu senja ini',
    'Gunakeun Kebal': 'Gunakan Kebal',
    'Konfirmasi gunakeun kebal?': 'Konfirmasi gunakan kebal?',
    '← Balik': '← Kembali',
    'Pilih saha anu rék dikunci': 'Pilih siapa yang ingin dikunci',
    'bakal nyaho maneh Ajengan': 'akan tahu kamu Ajengan',
    'Geura balik ka imah! Senja geus datang!': 'Cepat pulang ke rumah! Senja sudah datang!',
    'Sanekala, Dukun, Kolot, Kuncen, jeung Ajengan keur ngalakukeun aksi': 'Sanekala, Dukun, Kolot, Kuncen, dan Ajengan sedang melakukan aksi',
    'BEURANG KAHIJI': 'SIANG PERTAMA',
    'Wilujeng Sumping': 'Selamat Datang',
    'Ieu mangrupa beurang kahiji di lembur': 'Ini adalah siang pertama di desa',
    'Kenalan heula jeung batur saméméh senja datang': 'Kenalan dulu dengan yang lain sebelum senja datang',
    'Teu aya sidang ayeuna': 'Tidak ada sidang sekarang',
    'Sanekala bakal ngaliar': 'Sanekala akan berkeliaran',
    'Sanekala aya di antara urang': 'Sanekala ada di antara kita',
    'Gunakeun Ruqyah Massal pikeun ngahalangan Sanekala senja ieu': 'Gunakan Ruqyah Massal untuk menghalangi Sanekala senja ini',
    'SIDANG LEMBUR': 'SIDANG DESA',
    'Saha anu maneh curiga jadi Sanekala': 'Siapa yang kamu curigai sebagai Sanekala',
    'dikunci ku Kuncen': 'dikunci oleh Kuncen',
    'Maneh milih ngusir': 'Kamu memilih mengusir',
    'KAAYAAN LEMBUR': 'KEADAAN DESA',
    'kapanggih leungit': 'hilang',
    'Diculik ku Sanekala': 'Diculik oleh Sanekala',
    'Sadaya urang salamet senja ieu': 'Semua warga selamat senja ini',
    'Hiji urang diselamatkeun ku': 'Satu warga diselamatkan oleh',
    'Teu bisa divote ronde ieu': 'Tidak bisa divote ronde ini',
    'téh nyaéta': 'adalah',
    'Manéhna téh Sanekala': 'Dia adalah Sanekala',
    'diusir tina lembur': 'diusir dari desa',
    'Manéhna téh': 'Dia adalah',
    'Maneh geus tilar dunya': 'Kamu sudah mati',
    'Saksian wé jalannya kaulinan': 'Saksikan saja jalannya permainan',
    'Urang Lembur': 'Warga Desa',
    'hirup': 'hidup',
    '(Maneh)': '(Kamu)',
    'Obrolan Lembur': 'Obrolan Desa',
    'Bisik ka batur Sanekala': 'Bisik ke teman Sanekala',
    'Omongkeun pamadegan maneh': 'Bicarakan pendapatmu',
    'Arwah maneh teu bisa ngomong': 'Arwahmu tidak bisa bicara'
}

for old_text, new_text in replacements.items():
    content = content.replace(old_text, new_text)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("GameScene.js translation complete.")
