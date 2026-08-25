'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchAuth, getUtilisateur } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  MessageSquare, PenSquare, Bot, Search, Send, MessageSquareDashed
} from 'lucide-react'
import {
  MessagesContainer,
  ConversationsPanel, PanelHeader, PanelHeaderInner, ConversationsList,
  ConversationItem, ConvAvatar, ConvInfo, ConvTopRow, ConvName, ConvTime,
  ConvBottomRow, ConvPreview, UnreadBadge,
  ChatPanel, NoChatSelected, NoChatIcon, ChatHeader, ChatHeaderAvatar, ChatHeaderInfo,
  ChatHeaderName, ChatHeaderType,
  MessagesArea, MessageRow, MessageBubble, BubbleText, BubbleTime,
  InputBar, MessageInput, SendButton,
  LoadingText, EmptyText,
  TabsRow, TabButton,
  UserItem, UserAvatar, UserName, UserType,
  PinnedConversation, BotAvatar, BotBadge,
  SearchUsersWrapper, SearchUsersIcon, SearchUsersInput
} from '@/components/styleMessages'

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const destinataireParam = searchParams.get('destinataire')

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(destinataireParam || null)
  const [thread, setThread] = useState(null)
  const [nouveauMessage, setNouveauMessage] = useState('')
  const [isLoadingConvs, setIsLoadingConvs] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const [activeTab, setActiveTab] = useState('conversations')
  const [utilisateurs, setUtilisateurs] = useState([])
  const [searchUser, setSearchUser] = useState('')

  const moi = getUtilisateur()?.idUtilisateur
  const messagesEndRef = useRef(null)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetchAuth('/api/messages/conversations')
      const data = await res.json()
      if (res.ok) setConversations(data.conversations)
    } catch (e) { console.error(e) }
    finally { setIsLoadingConvs(false) }
  }, [])

  const fetchThread = useCallback(async (id) => {
    if (!id || id === 'chatbot') return
    try {
      const res = await fetchAuth(`/api/messages/${id}`)
      const data = await res.json()
      if (res.ok) setThread(data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchUtilisateurs = useCallback(async () => {
    try {
      const res = await fetchAuth('/api/messages/utilisateurs')
      const data = await res.json()
      if (res.ok) setUtilisateurs(data.utilisateurs)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => {
    if (activeTab === 'nouveau') fetchUtilisateurs()
  }, [activeTab, fetchUtilisateurs])

  useEffect(() => {
    if (activeId && activeId !== 'chatbot') fetchThread(activeId)
  }, [activeId, fetchThread])

  useEffect(() => {
    if (activeId === 'chatbot') {
      setThread({
        destinataire: { nomAffichage: 'Assistant Stage Share', typeUtilisateur: 'Chatbot' },
        messages: [
          {
            idMessage: 0,
            idExpediteur: 'bot',
            contenu: "Salut ! Je suis l'Assistant Stage Share. Pour l'instant je ne suis pas encore très intelligent, mais bientôt je pourrai t'aider à naviguer la plateforme, comprendre les offres et te guider dans tes candidatures. Écris-moi quand même, j'apprends !",
            dateEnvoi: new Date().toISOString()
          }
        ]
      })
    }
  }, [activeId])

  useEffect(() => {
    if (!activeId || activeId === 'chatbot') return
    const interval = setInterval(() => {
      fetchThread(activeId)
      fetchConversations()
    }, 5000)
    return () => clearInterval(interval)
  }, [activeId, fetchThread, fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const ouvrirConversation = (idUtilisateur) => {
    setActiveId(idUtilisateur)
    setActiveTab('conversations')
    setSearchUser('')
  }

  const ouvrirChatbot = () => {
    setActiveId('chatbot')
    setActiveTab('conversations')
  }

  const handleSend = async () => {
    if (!nouveauMessage.trim() || !activeId) return
    setIsSending(true)
    try {
      if (activeId === 'chatbot') {
        const messageEnvoye = {
          idMessage: Date.now(),
          idExpediteur: moi,
          contenu: nouveauMessage,
          dateEnvoi: new Date().toISOString()
        }
        const reponseBot = {
          idMessage: Date.now() + 1,
          idExpediteur: 'bot',
          contenu: "Merci pour ton message ! Je ne peux pas encore te répondre intelligemment, mais bientôt je serai connecté à une IA pour t'aider sur la plateforme. Reviens vite !",
          dateEnvoi: new Date(Date.now() + 500).toISOString()
        }
        setThread(prev => ({
          ...prev,
          messages: [...(prev?.messages || []), messageEnvoye, reponseBot]
        }))
        setNouveauMessage('')
        setIsSending(false)
        return
      }

      const res = await fetchAuth('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idDestinataire: activeId, contenu: nouveauMessage })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      setNouveauMessage('')
      await fetchThread(activeId)
      await fetchConversations()
    } catch (e) {
      alert('Erreur : ' + e.message)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    return sameDay
      ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const utilisateursFiltres = utilisateurs.filter(u => {
    if (!searchUser.trim()) return true
    const s = searchUser.toLowerCase().trim()
    return (
      u.nomAffichage?.toLowerCase().includes(s) ||
      u.emailUtilisateur?.toLowerCase().includes(s) ||
      u.typeUtilisateur?.toLowerCase().includes(s)
    )
  })

  return (
    <>
      <AppNavbar />
      <MessagesContainer>
        {/* === PANNEAU GAUCHE === */}
        <ConversationsPanel>
          <PanelHeader>
            <PanelHeaderInner>
              <MessageSquare size={20} strokeWidth={2} />
              Messages
            </PanelHeaderInner>
          </PanelHeader>

          <TabsRow>
            <TabButton
              $active={activeTab === 'conversations'}
              onClick={() => setActiveTab('conversations')}
            >
              <MessageSquare size={15} strokeWidth={2} />
              Conversations
            </TabButton>
            <TabButton
              $active={activeTab === 'nouveau'}
              onClick={() => setActiveTab('nouveau')}
            >
              <PenSquare size={15} strokeWidth={2} />
              Nouveau
            </TabButton>
          </TabsRow>

          {/* ----- Onglet : Conversations ----- */}
          {activeTab === 'conversations' ? (
            <ConversationsList>
              {/* Assistant Stage Share épinglé en haut */}
              

              {/* Liste des conversations classiques */}
              {isLoadingConvs ? (
                <LoadingText>Chargement...</LoadingText>
              ) : conversations.length === 0 ? (
                <EmptyText>
                  Aucune conversation pour le moment.<br />
                  Clique sur <strong>« Nouveau »</strong> pour démarrer une discussion.
                </EmptyText>
              ) : (
                conversations.map(c => (
                  <ConversationItem
                    key={c.autreId}
                    $active={String(c.autreId) === String(activeId)}
                    onClick={() => setActiveId(c.autreId)}
                  >
                    <ConvAvatar>{c.nomAffichage?.charAt(0).toUpperCase() || '?'}</ConvAvatar>
                    <ConvInfo>
                      <ConvTopRow>
                        <ConvName>{c.nomAffichage || 'Utilisateur'}</ConvName>
                        <ConvTime>{formatTime(c.derniereDateEnvoi)}</ConvTime>
                      </ConvTopRow>
                      <ConvBottomRow>
                        <ConvPreview>{c.dernierMessage}</ConvPreview>
                        {c.nonLus > 0 && <UnreadBadge>{c.nonLus}</UnreadBadge>}
                      </ConvBottomRow>
                    </ConvInfo>
                  </ConversationItem>
                ))
              )}
            </ConversationsList>
          ) : (
            /* ----- Onglet : Nouveau message ----- */
            <ConversationsList>
              <SearchUsersWrapper>
                <SearchUsersIcon>
                  <Search size={15} strokeWidth={2} />
                </SearchUsersIcon>
                <SearchUsersInput
                  placeholder="Rechercher par nom, email, type..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </SearchUsersWrapper>
              {utilisateursFiltres.length === 0 ? (
                <EmptyText>Aucun utilisateur trouvé.</EmptyText>
              ) : (
                utilisateursFiltres.map(u => (
                  <UserItem
                    key={u.idUtilisateur}
                    onClick={() => ouvrirConversation(u.idUtilisateur)}
                  >
                    <UserAvatar>
                      {u.photo
                        ? <img src={u.photo} alt={u.nomAffichage} />
                        : u.nomAffichage?.charAt(0).toUpperCase() || '?'}
                    </UserAvatar>
                    <ConvInfo>
                      <UserName>{u.nomAffichage}</UserName>
                      <UserType $type={u.typeUtilisateur}>{u.typeUtilisateur}</UserType>
                    </ConvInfo>
                  </UserItem>
                ))
              )}
            </ConversationsList>
          )}
        </ConversationsPanel>

        {/* === PANNEAU DROITE — fil de discussion === */}
        <ChatPanel>
          {!activeId ? (
            <NoChatSelected>
              <NoChatIcon>
                <MessageSquareDashed size={64} strokeWidth={1.5} />
              </NoChatIcon>
              <p>Sélectionnez une conversation pour commencer</p>
            </NoChatSelected>
          ) : (
            <>
              <ChatHeader>
                {thread?.destinataire && (
                  <>
                    <ChatHeaderAvatar>
                      {thread.destinataire.typeUtilisateur === 'Chatbot'
                        ? <Bot size={20} strokeWidth={2} />
                        : thread.destinataire.nomAffichage?.charAt(0).toUpperCase() || '?'}
                    </ChatHeaderAvatar>
                    <ChatHeaderInfo>
                      <ChatHeaderName>{thread.destinataire.nomAffichage}</ChatHeaderName>
                      <ChatHeaderType>{thread.destinataire.typeUtilisateur}</ChatHeaderType>
                    </ChatHeaderInfo>
                  </>
                )}
              </ChatHeader>

              <MessagesArea>
                {!thread ? (
                  <LoadingText>Chargement...</LoadingText>
                ) : thread.messages.length === 0 ? (
                  <EmptyText>Aucun message. Démarrez la conversation !</EmptyText>
                ) : (
                  thread.messages.map(m => (
                    <MessageRow key={m.idMessage} $mine={m.idExpediteur === moi}>
                      <MessageBubble
                        $mine={m.idExpediteur === moi}
                        $isBot={m.idExpediteur === 'bot'}
                      >
                        <BubbleText>{m.contenu}</BubbleText>
                        <BubbleTime>{formatTime(m.dateEnvoi)}</BubbleTime>
                      </MessageBubble>
                    </MessageRow>
                  ))
                )}
                <div ref={messagesEndRef} />
              </MessagesArea>

              <InputBar>
                <MessageInput
                  placeholder={
                    activeId === 'chatbot'
                      ? "Pose ta question à l'assistant..."
                      : "Écrivez votre message..."
                  }
                  value={nouveauMessage}
                  onChange={e => setNouveauMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <SendButton onClick={handleSend} disabled={isSending || !nouveauMessage.trim()}>
                  <Send size={15} strokeWidth={2} />
                  {isSending ? '...' : 'Envoyer'}
                </SendButton>
              </InputBar>
            </>
          )}
        </ChatPanel>
      </MessagesContainer>
    </>
  )
}