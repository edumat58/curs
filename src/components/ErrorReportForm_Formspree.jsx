import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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

const SetupInfo = styled.div`
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
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

    try {
      // Create email content
      const emailSubject = `Raporteaza o eroare - ${pageUrl}`;
      const emailBody = `
URL pagină: ${pageUrl}

Descriere problemă:
${description || 'Nu a fost furnizată o descriere.'}

---
Raport generat automat din cursurile online
Data: ${new Date().toLocaleString('ro-RO')}
      `.trim();

      // Use Formspree for email forwarding
      // You can create a free account at formspree.io and get an endpoint
      const FORMSPREE_ENDPOINT = 'https://formspree.io/f/your_form_id'; // Replace with your actual endpoint
      
      const formData = {
        _replyto: 'eduprof.uruguay@gmail.com',
        _subject: emailSubject,
        _cc: 'asbri.sebastian@gmail.com',
        _format: 'plain',
        message: emailBody,
        page_url: pageUrl,
        user_description: description || 'Nu a fost furnizată o descriere.'
      };

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to send email');
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Fallback: Open email client with pre-filled information
      const subject = `Raporteaza o eroare - ${pageUrl}`;
      const body = `
URL pagină: ${pageUrl}

Descriere problemă:
${description || 'Nu a fost furnizată o descriere.'}

---
Raport generat automat din cursurile online
Data: ${new Date().toLocaleString('ro-RO')}

Instrucțiuni pentru trimitere:
1. Selectează "Send from" → eduprof.uruguay@gmail.com
2. Trimite către: asbri.sebastian@gmail.com
3. Folosește subiectul de mai sus
4. Adaugă mesajul de mai sus
      `.trim();

      const mailtoLink = `mailto:asbri.sebastian@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      setError('Se deschide clientul de email cu informațiile pre-completate. Trimite email-ul de la eduprof.uruguay@gmail.com către asbri.sebastian@gmail.com');
      
      setTimeout(() => {
        window.location.href = mailtoLink;
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }, 2000);
      
    } finally {
      setIsLoading(false);
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
        
        <SetupInfo>
          <strong>📧 Configurare Email Automat:</strong><br/>
          Pentru trimitere automată, configurați Formspree.io gratuit:
          <br/>1. Creați cont pe formspree.io
          <br/>2. Obțineți endpoint-ul pentru email forwarding  
          <br/>3. Înlocuiți FORMSPREE_ENDPOINT în cod
        </SetupInfo>
        
        {isSuccess && (
          <StatusMessage className="success">
            ✅ Raportul a fost trimis cu succes! Se închide automat...
          </StatusMessage>
        )}
        
        {error && (
          <StatusMessage className="error">
            ⚠️ {error}
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
            {isLoading ? 'Se trimite...' : isSuccess ? 'Trimis cu succes!' : 'Trimite raportul'}
          </SubmitButton>
        </Form>
      </FormContainer>
    </Overlay>
  );
};

export default ErrorReportForm;