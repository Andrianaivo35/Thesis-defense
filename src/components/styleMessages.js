'use client'
import styled from 'styled-components'

export const MessagesContainer = styled.div`
  display: flex;
  height: calc(100vh - 40px);
  max-width: 1100px;
  margin: 20px auto;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  @media (max-width: 720px) {
    flex-direction: column;
    height: calc(100vh - 20px);
    margin: 10px;
  }
`

/* ===== PANNEAU CONVERSATIONS ===== */

export const ConversationsPanel = styled.div`
  width: 320px;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 720px) {
    width: 100%;
    max-height: 40%;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
`

export const PanelHeader = styled.div`
  padding: 18px 20px;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  border-bottom: 2px solid #BABF94;
`
export const PanelHeaderInner = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;

  svg { color: #A98B76; }
`

export const ConversationsList = styled.div`
  flex: 1;
  overflow-y: auto;
`

export const ConversationItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  background: ${p => p.$active ? '#f5f0eb' : 'white'};
  transition: background 0.15s ease;

  &:hover {
    background: ${p => p.$active ? '#f5f0eb' : '#f8fafc'};
  }
`

export const ConvAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(169, 139, 118, 0.25);
`

export const ConvInfo = styled.div`
  flex: 1;
  min-width: 0;
`

export const ConvTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`

export const ConvName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const ConvTime = styled.div`
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
`

export const ConvBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
`

export const ConvPreview = styled.div`
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`

export const UnreadBadge = styled.span`
  background: #BABF94;
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(186, 191, 148, 0.4);
`

/* ===== PANNEAU CHAT ===== */

export const ChatPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`

export const NoChatSelected = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 15px;
`

export const NoChatIcon = styled.div`
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
`

export const ChatHeaderAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(169, 139, 118, 0.25);
`

export const ChatHeaderInfo = styled.div``

export const ChatHeaderName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
`

export const ChatHeaderType = styled.div`
  font-size: 12px;
  color: #64748b;
`

export const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
`

export const MessageRow = styled.div`
  display: flex;
  justify-content: ${p => p.$mine ? 'flex-end' : 'flex-start'};
`

export const MessageBubble = styled.div`
  max-width: 70%;
  padding: 9px 13px;
  border-radius: 14px;
  background: ${p => p.$mine
    ? 'linear-gradient(135deg, #A98B76 0%, #BFA28C 100%)'
    : 'white'};
  color: ${p => p.$mine ? 'white' : '#1e293b'};
  border: ${p => p.$mine ? 'none' : '1px solid #e2e8f0'};
  border-bottom-right-radius: ${p => p.$mine ? '4px' : '14px'};
  border-bottom-left-radius: ${p => p.$mine ? '14px' : '4px'};
  box-shadow: ${p => p.$mine ? '0 2px 6px rgba(169, 139, 118, 0.25)' : 'none'};
`

export const BubbleText = styled.div`
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
`

export const BubbleTime = styled.div`
  font-size: 10px;
  margin-top: 4px;
  text-align: right;
  opacity: 0.7;
`

export const InputBar = styled.div`
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid #e2e8f0;
  background: white;
`

export const MessageInput = styled.input`
  flex: 1;
  padding: 11px 16px;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 22px;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }
`

export const SendButton = styled.button`
  padding: 11px 22px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(169, 139, 118, 0.4);

    svg { transform: translateX(2px); }
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const LoadingText = styled.div`
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 14px;
`

export const EmptyText = styled.div`
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 14px;
`

/* ===== ONGLETS CONVERSATIONS / NOUVEAU ===== */

export const TabsRow = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
`

export const TabButton = styled.button`
  flex: 1;
  padding: 12px 14px;
  background: ${p => p.$active ? 'white' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${p => p.$active ? '#A98B76' : 'transparent'};
  font-size: 13.5px;
  font-weight: ${p => p.$active ? 700 : 500};
  color: ${p => p.$active ? '#A98B76' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  &:hover { color: #A98B76; }
`

/* ===== ITEM UTILISATEUR (onglet Nouveau) ===== */

export const SearchUsersWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 4px;
`

export const SearchUsersIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  z-index: 1;
`

export const SearchUsersInput = styled.input`
  width: 100%;
  padding: 10px 14px 10px 34px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13.5px;
  outline: none;
  background: #f8fafc;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &:focus {
    border-color: #A98B76;
    background: white;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.12);
  }

  ${SearchUsersWrapper}:focus-within ${SearchUsersIcon} {
    color: #A98B76;
  }
`

export const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #f5f0eb;
    transform: translateX(2px);
  }
`

export const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(169, 139, 118, 0.25);

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 2px;
`

export const UserType = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;

  ${p => {
    if (p.$type === 'Etudiant') return `background: #d1fae5; color: #065f46;`
    if (p.$type === 'Entreprise') return `background: #e0e7ff; color: #4338ca;`
    if (p.$type === 'Universite') return `background: #dbeafe; color: #1e40af;`
    return `background: #f1f5f9; color: #64748b;`
  }}
`

/* ===== CHATBOT ÉPINGLÉ (gardé en violet pour son identité d'IA) ===== */

export const PinnedConversation = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${p => p.$active 
    ? 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' 
    : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'};
  border: 1.5px solid ${p => p.$active ? '#8b5cf6' : '#c4b5fd'};

  &:hover { 
    transform: translateX(2px); 
    border-color: #8b5cf6;
  }
`

export const BotAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
`

export const BotBadge = styled.span`
  display: inline-block;
  padding: 2px 7px;
  background: #8b5cf6;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 5px;
  letter-spacing: 0.5px;
`
/* ---------------------------------------------------------------------
   Ajouts UI/UX (audit MD/7)
   --------------------------------------------------------------------- */

/* Séparateur de date. Sans lui, rien ne distingue un message de ce matin
   d'un message d'il y a trois semaines : le fil se lit comme une seule
   conversation continue, ce qu'il n'est pas. */
export const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 10px;
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 600;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }
`

/* Message en cours d'envoi : présent à l'écran, visiblement pas encore
   confirmé. C'est ce qui évite qu'on réappuie sur « Envoyer ». */
export const BubbleEtat = styled.span`
  font-size: 10.5px;
  margin-left: 7px;
  opacity: .8;
  color: ${p => (p.$echec ? '#dc2626' : 'inherit')};
`

export const RetryButton = styled.button`
  margin-left: 8px;
  padding: 0;
  font-size: 10.5px;
  font-weight: 700;
  color: #dc2626;
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
`
