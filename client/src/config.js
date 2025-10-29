// Configuração automática da URL da API
const getApiUrl = () => {
  // Em produção (Railway), frontend e backend estão no mesmo domínio
  // Então usamos URLs relativas (sem localhost)
  if (process.env.NODE_ENV === 'production') {
    return ''; // URL relativa - usa o mesmo domínio
  }
  // Em desenvolvimento, usa localhost
  return 'http://localhost:5001';
};

export const API_URL = getApiUrl();

