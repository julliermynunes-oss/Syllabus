import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const useCourseLayoutModel = (curso) => {
  const { token } = useAuth();
  const [layoutModel, setLayoutModel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLayout = async () => {
      if (!curso || !token) {
        if (isMounted) {
          setLayoutModel(null);
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/syllabus-config/active`, {
          params: { curso },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          setLayoutModel(response.data || null);
        }
      } catch (error) {
        console.error('Erro ao carregar modelo de layout:', error);
        if (isMounted) {
          setLayoutModel(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLayout();

    return () => {
      isMounted = false;
    };
  }, [curso, token]);

  return { layoutModel, isLoading };
};

export default useCourseLayoutModel;

