'use client'
import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchAuth, getUtilisateur } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  MessageSquare, PenSquare, Search, Send, MessageSquareDashed
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
  DateSeparator, BubbleEtat, RetryButton,
  LoadingText, EmptyText,
  TabsRow, TabButton,
  UserItem, UserAvatar, UserName, UserType,
  SearchUsersWrapper, SearchUsersIcon, SearchUsersInput
} from '@/components/styleMessages'

/* Libellé de séparateur : « Aujourd'hui » et « Hier » plutôt qu'une
   date, parce que c'est ainsi qu'on situe une conversation récente. */
function libelleJour(iso) {
  const d = new Date(iso)
  const jour = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const aujourdhui = new Date()
  const zero = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate())
  const ecart = Math.round((zero - jour) / 86400000)
  if (ecart === 0) return "Aujourd'hui"
  if (ecart === 1) return 'Hier'
  if (ecart < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const memeJour = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString()

/* Deux messages du même auteur à moins d'une minute forment un bloc :
   répéter l'heure sur chacun hache la lecture sans rien apprendre. */
const memeBloc = (a, b) =>
  a && b && a.idExpediteur === b.idExpediteur &&
  Math.abs(new Date(a.dateEnvoi) - new Date(b.dateEnvoi)) < 60000 &&
  memeJour(a.dateEnvoi, b.dateEnvoi)

function MessagesPageInner() {
  const searchParams = useSearchParams()
  const destinataireParam = searchParams.get('destinataire')

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(destinataireParam || null)
  const [thread, setThread] = useState(null)
  const [nouveauMessage, setNouveauMessage] = useState('')
  const [isLoadingConvs, setIsLoadingConvs] = useState(true)
  const [isSending, setIsSending] = useState(false)

  /* Messages envoyés mais pas encore confirmés par le serveur.
     Ils s'affichent immédiatement : sur une connexion lente, attendre
     l'aller-retour donne l'impression que rien n'est parti, et
     l'utilisateur réappuie. */
  const [enVol, setEnVol] = useState([])
  const [rechercheConv, setRechercheConv] = useState('')

  const [activeTab, setActiveTab] = useState('conversations')
  const [utilisateurs, setUtilisateurs] = useState([])
  const [searchUser, setSearchUser] = useState('')

  const conversationsFiltrees = (() => {
    const q = rechercheConv.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(c =>
      (c.nomAffichage || '').toLowerCase().includes(q) ||
      (c.dernierMessage || '').toLowerCase().includes(q))
  })()

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
    if (!id) return
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
    if (activeId) fetchThread(activeId)
  }, [activeId, fetchThread])

  /* Le sondage s'arrête quand l'onglet passe en arrière-plan, et
     reprend au retour — avec un rafraîchissement immédiat, pour ne pas
     faire attendre cinq secondes de plus quelqu'un qui revient. */
  useEffect(() => {
    if (!activeId) return
    let interval = null

    const demarrer = () => {
      if (interval) return
      interval = setInterval(() => {
        fetchThread(activeId)
        fetchConversations()
      }, 5000)
    }
    const arreter = () => {
      if (interval) { clearInterval(interval); interval = null }
    }
    const surVisibilite = () => {
      if (document.hidden) arreter()
      else { fetchThread(activeId); fetchConversations(); demarrer() }
    }

    demarrer()
    document.addEventListener('visibilitychange', surVisibilite)
    return () => {
      arreter()
      document.removeEventListener('visibilitychange', surVisibilite)
    }
  }, [activeId, fetchThread, fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const reessayer = (m) => {
    setEnVol(prev => prev.map(x => x.cle === m.cle ? { ...x, echec: false } : x))
    envoyer(m.contenu, m.cle)
  }

  const ouvrirConversation = (idUtilisateur) => {
    /* Les messages non confirmés appartiennent à la conversation qu'on
       quitte : les laisser les afficherait dans la suivante. */
    setEnVol([])
    setActiveId(idUtilisateur)
    setActiveTab('conversations')
    setSearchUser('')
  }

  /* Envoi optimiste : le message apparaît tout de suite, marqué « envoi… »,
     puis disparaît de la file d'attente quand le serveur l'a confirmé —
     il revient alors par le fil, avec son vrai identifiant.

     En cas d'échec il reste à l'écran, signalé, avec un bouton pour
     réessayer. L'ancienne version affichait une boîte d'alerte et
     perdait le texte saisi. */
  const envoyer = useCallback(async (contenu, cleLocale) => {
    try {
      const res = await fetchAuth('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idDestinataire: activeId, contenu })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)

      await fetchThread(activeId)
      await fetchConversations()
      setEnVol(prev => prev.filter(m => m.cle !== cleLocale))
    } catch (e) {
      setEnVol(prev => prev.map(m =>
        m.cle === cleLocale ? { ...m, echec: true, erreur: e.message } : m))
    }
  }, [activeId, fetchThread, fetchConversations])

  const handleSend = async () => {
    const contenu = nouveauMessage.trim()
    if (!contenu || !activeId) return

    const cleLocale = `local-${Date.now()}`
    setEnVol(prev => [...prev, { cle: cleLocale, contenu, dateEnvoi: new Date().toISOString() }])
    setNouveauMessage('')
    setIsSending(true)
    try {
      await envoyer(contenu, cleLocale)
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
              {/* Recherche dans les conversations existantes. Elle
                  n'existait que dans l'onglet « Nouveau » : au-delà
                  d'une dizaine d'échanges, retrouver quelqu'un imposait
                  de faire défiler. */}
              <SearchUsersWrapper>
                <SearchUsersIcon>
                  <Search size={15} strokeWidth={2} />
                </SearchUsersIcon>
                <SearchUsersInput
                  placeholder="Rechercher une conversation..."
                  value={rechercheConv}
                  onChange={(e) => setRechercheConv(e.target.value)}
                />
              </SearchUsersWrapper>

              {isLoadingConvs ? (
                <LoadingText>Chargement...</LoadingText>
              ) : conversationsFiltrees.length === 0 ? (
                <EmptyText>
                  {rechercheConv
                    ? 'Aucune conversation ne correspond.'
                    : <>Aucune conversation pour le moment.<br />
                       Cliquez sur <strong>« Nouveau »</strong> pour démarrer une discussion.</>}
                </EmptyText>
              ) : (
                conversationsFiltrees.map(c => (
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
                  placeholder="Rechercher par nom ou type..."
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
                      {thread.destinataire.nomAffichage?.charAt(0).toUpperCase() || '?'}
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
                ) : thread.messages.length === 0 && enVol.length === 0 ? (
                  <EmptyText>Aucun message. Démarrez la conversation !</EmptyText>
                ) : (
                  <>
                    {thread.messages.map((m, i) => {
                      const precedent = thread.messages[i - 1]
                      const nouveauJour = !precedent || !memeJour(precedent.dateEnvoi, m.dateEnvoi)
                      /* L'heure n'est affichée qu'au DERNIER message d'un
                         bloc : la répéter sur chacun hache la lecture. */
                      const finDeBloc = !memeBloc(m, thread.messages[i + 1])

                      return (
                        <div key={m.idMessage}>
                          {nouveauJour && (
                            <DateSeparator>{libelleJour(m.dateEnvoi)}</DateSeparator>
                          )}
                          <MessageRow $mine={m.idExpediteur === moi}>
                            <MessageBubble $mine={m.idExpediteur === moi}>
                              <BubbleText>{m.contenu}</BubbleText>
                              {finDeBloc && <BubbleTime>{formatTime(m.dateEnvoi)}</BubbleTime>}
                            </MessageBubble>
                          </MessageRow>
                        </div>
                      )
                    })}

                    {/* Messages envoyés, pas encore confirmés. Ils sont à
                        l'écran dès la frappe : attendre la réponse du
                        serveur donnait l'impression que rien n'était parti. */}
                    {enVol.map(m => (
                      <MessageRow key={m.cle} $mine>
                        <MessageBubble $mine style={{ opacity: m.echec ? 1 : 0.6 }}>
                          <BubbleText>{m.contenu}</BubbleText>
                          <BubbleTime>
                            {formatTime(m.dateEnvoi)}
                            {m.echec ? (
                              <>
                                <BubbleEtat $echec>· non envoyé</BubbleEtat>
                                <RetryButton onClick={() => reessayer(m)}>Réessayer</RetryButton>
                              </>
                            ) : (
                              <BubbleEtat>· envoi…</BubbleEtat>
                            )}
                          </BubbleTime>
                        </MessageBubble>
                      </MessageRow>
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </MessagesArea>

              <InputBar>
                <MessageInput
                  placeholder="Écrivez votre message..."
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

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  )
}