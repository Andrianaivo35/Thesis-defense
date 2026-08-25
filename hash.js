const bcrypt = require('bcryptjs');

const motDePasse = 'admin123';   // ⚠️ choisis TON mot de passe

bcrypt.hash(motDePasse, 10).then(hash => {
  console.log('Mot de passe :', motDePasse);
  console.log('Hash :', hash);
});

