import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    confirmar_senha: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isLogin) {
      if (formData.senha !== formData.confirmar_senha) {
        setError('As senhas não coincidem');
        setIsLoading(false);
        return;
      }
      if (!formData.nome_completo) {
        setError('Nome completo é obrigatório');
        setIsLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const response = await axios.post(
        `http://localhost:5001${endpoint}`,
        isLogin
          ? { email: formData.email, senha: formData.senha }
          : {
              nome_completo: formData.nome_completo,
              email: formData.email,
              senha: formData.senha
            }
      );

      login(response.data.user, response.data.token);
      navigate('/syllabi');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/FGV_Logo.png" alt="FGV Logo" className="logo" />
        <h1 className="login-title">
          {isLogin ? 'Login' : 'Cadastro'}
        </h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirmar Senha</label>
              <input
                type="password"
                name="confirmar_senha"
                value={formData.confirmar_senha}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="auth-toggle">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({
                nome_completo: '',
                email: '',
                senha: '',
                confirmar_senha: ''
              });
            }}
          >
            {isLogin
              ? 'Não tem uma conta? Cadastre-se'
              : 'Já tem uma conta? Faça login'}
          </button>
        </div>

        {isLogin && (
          <div className="forgot-password">
            <button type="button">Esqueci minha senha</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

