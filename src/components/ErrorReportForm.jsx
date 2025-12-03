import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Backend endpoint configuration
const EMAIL_BACKEND_URL = 'https://backend-nmxw515k4-deussebyum11724s-projects.vercel.app/send-error-report';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;

const FormContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #000;
  }
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.25rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(45deg, #8b5cf6, #06b6d4);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.7 : 1};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 5px 15px rgba(139, 92, 246, 0.3)'};
  }
  
  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(0)'};
  }
`;

const StatusMessage = styled.div`
  padding: 0.75rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-weight: 500;
  text-align: center;
  
  &.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  &.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
`;

const InfoBox = styled.div`
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #bbdefb;
  font-size: 0.875rem;
  line-height: 1.4;
`;



const ErrorReportForm = ({ isOpen, onClose }) => {
  const [pageUrl, setPageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPageUrl(window.location.href);
      setIsSuccess(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    console.log('DEBUG: Starting email submission to backend');

    try {
      // Prepare data for backend
      const requestData = {
        pageUrl: pageUrl,
        description: description || 'Nu a fost furnizată o descriere.'
      };
      console.log('DEBUG: Request data prepared:', requestData);

      // Send email via backend using nodemailer
      const response = await fetch(EMAIL_BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('DEBUG: Backend response:', result);

      if (response.ok && result.success) {
        console.log('DEBUG: Email sent successfully via nodemailer backend');
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(result.message || 'Backend returned error');
      }

    } catch (error) {
      console.error('DEBUG: Error sending email via backend:', error);
      setError('Eroare la trimiterea email-ului. Verificați configurația backend-ului.');
    } finally {
      setIsLoading(false);
      console.log('DEBUG: Submission process completed');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={handleOverlayClick}>
      <FormContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} disabled={isLoading}>&times;</CloseButton>
        <Title>Raportează o eroare în pagină</Title>
        
        {isSuccess && (
          <StatusMessage className="success">
            ✅ Raportul a fost trimis automat cu succes! Se închide automat...
          </StatusMessage>
        )}
        
        {error && (
          <StatusMessage className="error">
            ❌ {error}
          </StatusMessage>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Field>
            <Label>URL Pagină</Label>
            <Input 
              type="text" 
              value={pageUrl} 
              readOnly 
              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
              disabled={isLoading}
            />
          </Field>
          
          <Field>
            <Label>Descrie problema (opțional)</Label>
            <TextArea 
              placeholder="Descrieți problema întâlnită în această pagină..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          
          <SubmitButton type="submit" disabled={isLoading || isSuccess}>
            {isLoading ? 'Se trimite...' : isSuccess ? 'Trimis cu succes!' : 'Trimite raportul automat'}
          </SubmitButton>
        </Form>
      </FormContainer>
    </Overlay>
  );
};

export default ErrorReportForm;