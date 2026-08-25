// Récupérer le token
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Récupérer les infos utilisateur
export function getUtilisateur() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('utilisateur');
  return data ? JSON.parse(data) : null;
}

// Vérifier si connecté
export function isAuthenticated() {
  return !!getToken();
}

// Déconnexion
export const logout = () => {
  // 1. Détermine la page de login à utiliser AVANT de supprimer les données
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const type = utilisateur?.typeUtilisateur
  
  let loginPath = '/'  // par défaut : page d'accueil
  if (type === 'Etudiant') loginPath = '/pages/etudiantLogin'
  else if (type === 'Entreprise') loginPath = '/pages/entrepriseLogin'
  else if (type === 'Universite') loginPath = '/pages/universiteLogin'
  else if (type === 'Admin') loginPath = '/pages/adminLogin'
  
  // 2. Vide le localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('utilisateur')
  
  // 3. Redirige vers la bonne page de login
  window.location.href = loginPath
}

// Helper pour fetch authentifié
export async function fetchAuth(url, options = {}) {
  const token = getToken();

  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // ✅ Ne forcer Content-Type que si le body N'EST PAS un FormData
  // Pour FormData, le navigateur définit lui-même le Content-Type
  // avec son "boundary" pour le multipart/form-data nécessaire aux uploads
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  // Si 401 : token invalide ou expiré → déconnexion + redirection
  if (res.status === 401 && typeof window !== 'undefined') {
    logout();

    if (!window.location.pathname.toLowerCase().includes('login')) {
      // Redirection intelligente selon le type d'utilisateur ou le contexte
      const utilisateur = getUtilisateur();
      const type = utilisateur?.typeUtilisateur;
      const path = window.location.pathname.toLowerCase();

      let loginPath = '/pages/entrepriseLogin'; // par défaut

      if (type === 'Etudiant' 
          || path.includes('etudiant') 
          || path.includes('qcm') 
          || path.includes('listeoffre')
          || path.includes('candidature')) {
        loginPath = '/pages/etudiantLogin';
      } else if (type === 'Universite' || path.includes('universite')) {
        loginPath = '/pages/universiteLogin';
      }

      window.location.href = loginPath;
    }
  }

  return res;
}