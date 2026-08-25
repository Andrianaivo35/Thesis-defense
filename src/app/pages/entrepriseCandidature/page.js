'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  Users, GraduationCap, BookMarked, Building, Calendar,
  FileText, FileEdit, MessageCircle, UserCheck, CheckCircle2, Search
} from 'lucide-react'
import {
  PageContainer, PageHeader, PageTitle,
  StatsRow, StatCard, StatValue, StatLabel,
  FilterBar, FilterGroup, FilterLabel, FilterSelect,
  SearchInputWrapper, SearchInputIcon, SearchInput,
  CandidaturesList, CandidatCard, CandidatLeft, CandidatAvatar,
  CandidatInfo, CandidatName, CandidatEmail, CandidatMeta, CandidatMetaItem,
  CandidatMiddle, OfferBadge, DateInfo, StatutBadge,
  CandidatRight, ScoreCircle, ScoreLabel,
  CandidatActions, ActionLink,
  ActionButtonsRow, MessageButton, RecruterButton, RecruteBadge,
  EmptyState, LoadingState
} from '@/components/styleCandidatureEntreprise'

export default function EntrepriseCandidatures() {
  const router = useRouter()
  const [candidatures, setCandidatures] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const [filterOffre, setFilterOffre] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('score')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchAuth('/api/entrepriseCandidature')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
        setCandidatures(data.candidatures)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleVoirEtudiant = (idEtudiant) => {
    router.push(`/pages/etudiantProfil/${idEtudiant}`)
  }

  const handleMessage = (idUtilisateurEtudiant) => {
    if (!idUtilisateurEtudiant) {
      alert("Impossible d'ouvrir la conversation : identifiant manquant.")
      return
    }
    router.push(`/pages/messages?destinataire=${idUtilisateurEtudiant}`)
  }

  const handleRecruter = async (idCandidature, prenom, nom) => {
    if (!confirm(`Confirmer le recrutement de ${prenom} ${nom} ?`)) return

    setUpdatingId(idCandidature)
    try {
      const res = await fetchAuth(`/api/valideRecrutementEtudiant/${idCandidature}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'Recruté' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)

      setCandidatures(prev => prev.map(c =>
        c.idCandidature === idCandidature ? { ...c, statut: 'Recruté' } : c
      ))
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const offresList = useMemo(() => {
    const map = new Map()
    candidatures.forEach(c => {
      if (!map.has(c.idOffre)) {
        map.set(c.idOffre, { idOffre: c.idOffre, titreOffre: c.titreOffre })
      }
    })
    return Array.from(map.values())
  }, [candidatures])

  const candidaturesFiltrees = useMemo(() => {
    let filtered = candidatures

    if (filterOffre !== 'all') {
      filtered = filtered.filter(c => c.idOffre === parseInt(filterOffre))
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(c =>
        c.nomEtudiant?.toLowerCase().includes(search) ||
        c.prenomEtudiant?.toLowerCase().includes(search) ||
        c.emailUtilisateur?.toLowerCase().includes(search) ||
        c.titreOffre?.toLowerCase().includes(search)
      )
    }

    const sorted = [...filtered]
    if (sortBy === 'score') {
      sorted.sort((a, b) => (parseFloat(b.scoreMatching) || 0) - (parseFloat(a.scoreMatching) || 0))
    } else if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(b.dateCandidature) - new Date(a.dateCandidature))
    } else if (sortBy === 'nom') {
      sorted.sort((a, b) => (a.nomEtudiant || '').localeCompare(b.nomEtudiant || ''))
    }

    return sorted
  }, [candidatures, filterOffre, searchTerm, sortBy])

  const stats = useMemo(() => {
    if (candidaturesFiltrees.length === 0) {
      return { total: 0, average: 0, max: 0, recrutes: 0 }
    }
    const scores = candidaturesFiltrees.map(c => parseFloat(c.scoreMatching) || 0)
    return {
      total: candidaturesFiltrees.length,
      average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      max: Math.max(...scores).toFixed(1),
      recrutes: candidaturesFiltrees.filter(c => c.statut === 'Recruté').length
    }
  }, [candidaturesFiltrees])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const getScoreColor = (score) => {
    const s = parseFloat(score) || 0
    if (s >= 70) return 'green'
    if (s >= 40) return 'orange'
    return 'red'
  }

  if (isLoading) {
    return <PageContainer><LoadingState>Chargement des candidatures...</LoadingState></PageContainer>
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <Users size={22} strokeWidth={2} />
            Candidatures reçues
          </PageTitle>
        </PageHeader>

        <StatsRow>
          <StatCard>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Candidatures</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.average}%</StatValue>
            <StatLabel>Score moyen</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.max}%</StatValue>
            <StatLabel>Meilleur score</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.recrutes}</StatValue>
            <StatLabel>Recrutés</StatLabel>
          </StatCard>
        </StatsRow>

        <FilterBar>
          <FilterGroup>
            <FilterLabel>Offre</FilterLabel>
            <FilterSelect value={filterOffre} onChange={(e) => setFilterOffre(e.target.value)}>
              <option value="all">Toutes les offres ({candidatures.length})</option>
              {offresList.map(o => (
                <option key={o.idOffre} value={o.idOffre}>{o.titreOffre}</option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Trier par</FilterLabel>
            <FilterSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="score">Score (décroissant)</option>
              <option value="date">Date (récent → ancien)</option>
              <option value="nom">Nom (A → Z)</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup style={{ flex: 1, minWidth: '200px' }}>
            <FilterLabel>Recherche</FilterLabel>
            <SearchInputWrapper>
              <SearchInputIcon>
                <Search size={16} strokeWidth={2} />
              </SearchInputIcon>
              <SearchInput
                type="text"
                placeholder="Nom, prénom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchInputWrapper>
          </FilterGroup>
        </FilterBar>

        {candidaturesFiltrees.length === 0 ? (
          <EmptyState>
            {candidatures.length === 0
              ? "Vous n'avez encore reçu aucune candidature."
              : "Aucune candidature ne correspond aux filtres."}
          </EmptyState>
        ) : (
          <CandidaturesList>
            {candidaturesFiltrees.map((c) => (
              <CandidatCard key={c.idCandidature}>
                <CandidatLeft
                  onClick={() => handleVoirEtudiant(c.idEtudiant)}
                  style={{ cursor: 'pointer' }}
                  title="Voir le profil de l'étudiant"
                >
                  <CandidatAvatar>
                    {(c.prenomEtudiant?.charAt(0) || '') + (c.nomEtudiant?.charAt(0) || '')}
                  </CandidatAvatar>
                  <CandidatInfo>
                    <CandidatName>{c.prenomEtudiant} {c.nomEtudiant}</CandidatName>
                    <CandidatEmail>{c.emailUtilisateur}</CandidatEmail>
                    <CandidatMeta>
                      {c.niveauAcademique && (
                        <CandidatMetaItem>
                          <GraduationCap size={13} strokeWidth={2} />
                          {c.niveauAcademique}
                        </CandidatMetaItem>
                      )}
                      {c.filiere && (
                        <CandidatMetaItem>
                          <BookMarked size={13} strokeWidth={2} />
                          {c.filiere}
                        </CandidatMetaItem>
                      )}
                      {c.nomUniversite && (
                        <CandidatMetaItem>
                          <Building size={13} strokeWidth={2} />
                          {c.nomUniversite}
                        </CandidatMetaItem>
                      )}
                    </CandidatMeta>
                  </CandidatInfo>
                </CandidatLeft>

                <CandidatMiddle>
                  <OfferBadge>{c.titreOffre}</OfferBadge>
                  <DateInfo>
                    <Calendar size={12} strokeWidth={2} />
                    Postulé le {formatDate(c.dateCandidature)}
                  </DateInfo>
                  <StatutBadge $statut={c.statut}>{c.statut}</StatutBadge>

                  <CandidatActions>
                    {c.cv && (
                      <ActionLink href={c.cv} target="_blank" rel="noopener noreferrer">
                        <FileText size={13} strokeWidth={2} />
                        Voir CV
                      </ActionLink>
                    )}
                    {c.lettreMotivation && (
                      <ActionLink href={c.lettreMotivation} target="_blank" rel="noopener noreferrer">
                        <FileEdit size={13} strokeWidth={2} />
                        Voir lettre
                      </ActionLink>
                    )}
                  </CandidatActions>

                  <ActionButtonsRow>
                    <MessageButton onClick={() => handleMessage(c.idUtilisateurEtudiant)}>
                      <MessageCircle size={14} strokeWidth={2} />
                      Envoyer un message
                    </MessageButton>

                    {c.statut === 'Recruté' ? (
                      <RecruteBadge>
                        <CheckCircle2 size={14} strokeWidth={2.5} />
                        Recruté
                      </RecruteBadge>
                    ) : (
                      <RecruterButton
                        onClick={() => handleRecruter(c.idCandidature, c.prenomEtudiant, c.nomEtudiant)}
                        disabled={updatingId === c.idCandidature}
                      >
                        {updatingId === c.idCandidature ? (
                          'Traitement...'
                        ) : (
                          <>
                            <UserCheck size={14} strokeWidth={2} />
                            Recruter
                          </>
                        )}
                      </RecruterButton>
                    )}
                  </ActionButtonsRow>
                </CandidatMiddle>

                <CandidatRight>
                  <ScoreCircle $color={getScoreColor(c.scoreMatching)}>
                    {parseFloat(c.scoreMatching || 0).toFixed(0)}%
                  </ScoreCircle>
                  <ScoreLabel>Score QCM</ScoreLabel>
                </CandidatRight>
              </CandidatCard>
            ))}
          </CandidaturesList>
        )}
      </PageContainer>
    </>
  )
}