'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import {
  PageContainer, HeaderSection, SearchBar, FiltersBar, FilterLabel, FilterSelect,
  PageTitle,
  StatsRow, StatCard, StatValue, StatLabel,
  EtudiantsGrid, EtudiantCard, EtudiantAvatar,
  EtudiantHeader, EtudiantName, EtudiantLevel,
  EtudiantInfo, EtudiantInfoItem,
  StageTag, NoStageTag,
  EtudiantFooter, ViewProfileButton,
  EmptyState, LoadingState
} from '@/components/styleUniversiteEtudiants'

export default function UniversiteEtudiants() {
  const router = useRouter()
  const [etudiants, setEtudiants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('all')

  useEffect(() => {
    const fetchEtudiants = async () => {
      try {
        const res = await fetchAuth('/api/universiteEtudiant')
        const data = await res.json()
        if (!res.ok) throw new Error(data.details || data.error)
        setEtudiants(data.etudiants)
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEtudiants()
  }, [])

  const niveauxList = useMemo(() => {
    const set = new Set()
    etudiants.forEach(e => e.niveauAcademique && set.add(e.niveauAcademique))
    return Array.from(set).sort()
  }, [etudiants])

  const etudiantsFiltres = useMemo(() => {
    let filtered = etudiants

    if (filterNiveau !== 'all') {
      filtered = filtered.filter(e => e.niveauAcademique === filterNiveau)
    }

    const search = searchTerm.toLowerCase().trim()
    if (search) {
      filtered = filtered.filter(e =>
        e.nomEtudiant?.toLowerCase().includes(search) ||
        e.prenomEtudiant?.toLowerCase().includes(search) ||
        e.filiere?.toLowerCase().includes(search) ||
        e.specialisation?.toLowerCase().includes(search) ||
        e.emailUtilisateur?.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [etudiants, searchTerm, filterNiveau])

  // Statistiques
  const stats = useMemo(() => ({
    total: etudiants.length,
    enStage: etudiants.filter(e => e.stageEntreprise).length,
    actifs: etudiants.filter(e => e.estActif).length
  }), [etudiants])

  const handleVoirProfil = (idEtudiant) => {
    router.push(`/pages/etudiantProfil/${idEtudiant}`)
  }

  return (
    <PageContainer>
      <HeaderSection>
        <SearchBar
          type="text"
          placeholder="🔍 Rechercher un étudiant par nom, filière, spécialisation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FiltersBar>
          <FilterLabel>Niveau académique :</FilterLabel>
          <FilterSelect value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}>
            <option value="all">Tous les niveaux</option>
            {niveauxList.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </FilterSelect>
        </FiltersBar>
      </HeaderSection>

      {/* === Statistiques === */}
      <StatsRow>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Étudiants inscrits</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.enStage}</StatValue>
          <StatLabel>En stage</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.actifs}</StatValue>
          <StatLabel>Comptes actifs</StatLabel>
        </StatCard>
      </StatsRow>

      <PageTitle>Mes étudiants ({etudiantsFiltres.length})</PageTitle>

      {isLoading ? (
        <LoadingState>Chargement des étudiants...</LoadingState>
      ) : etudiantsFiltres.length === 0 ? (
        <EmptyState>
          {searchTerm || filterNiveau !== 'all'
            ? 'Aucun étudiant ne correspond à vos critères.'
            : 'Aucun étudiant inscrit pour le moment.'}
        </EmptyState>
      ) : (
        <EtudiantsGrid>
          {etudiantsFiltres.map((e) => (
            <EtudiantCard
              key={e.idEtudiant}
              onClick={() => handleVoirProfil(e.idEtudiant)}
            >
              <EtudiantAvatar>
                {e.photoProfil ? (
                  <img src={e.photoProfil} alt={e.prenomEtudiant} />
                ) : (
                  (e.prenomEtudiant?.charAt(0) || '') + (e.nomEtudiant?.charAt(0) || '')
                )}
              </EtudiantAvatar>

              <EtudiantHeader>
                <EtudiantName>{e.prenomEtudiant} {e.nomEtudiant}</EtudiantName>
                {e.niveauAcademique && <EtudiantLevel>{e.niveauAcademique}</EtudiantLevel>}
              </EtudiantHeader>

              <EtudiantInfo>
                {e.filiere && <EtudiantInfoItem>📚 {e.filiere}</EtudiantInfoItem>}
                {e.specialisation && <EtudiantInfoItem>🎯 {e.specialisation}</EtudiantInfoItem>}
                <EtudiantInfoItem>📋 {e.nombreCandidatures || 0} candidature(s)</EtudiantInfoItem>
              </EtudiantInfo>

              {/* Statut de stage */}
              {e.stageEntreprise ? (
                <StageTag>
                  🎉 En stage : {e.stagePoste} chez <strong>{e.stageEntreprise}</strong>
                </StageTag>
              ) : (
                <NoStageTag>Pas encore en stage</NoStageTag>
              )}

              <EtudiantFooter>
                <ViewProfileButton>Voir le profil et les activités →</ViewProfileButton>
              </EtudiantFooter>
            </EtudiantCard>
          ))}
        </EtudiantsGrid>
      )}
    </PageContainer>
  )
}