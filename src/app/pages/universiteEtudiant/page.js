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
  const [demandes, setDemandes] = useState([])
  const [traitementEnCours, setTraitementEnCours] = useState(null)
  const [messageDemande, setMessageDemande] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('all')
  const [promotions, setPromotions] = useState([])
  const [sansPromotion, setSansPromotion] = useState(0)
  const [filtrePromotion, setFiltrePromotion] = useState('all')

  const chargerEtudiants = async () => {
    try {
      /* Les promotions sont chargées en parallèle : l'écran s'organise
         autour d'elles, il ne doit pas attendre deux allers-retours. */
      fetchAuth('/api/universitePromotions')
        .then(r => r.json())
        .then(d => { setPromotions(d.promotions || []); setSansPromotion(d.sansPromotion || 0) })
        .catch(() => {})

      const res = await fetchAuth('/api/universiteEtudiant')
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error)
      setEtudiants(data.etudiants || [])
      setDemandes(data.demandesRattachement || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    chargerEtudiants()
  }, [])

  // Valider ou refuser une demande de rattachement
  const traiterDemande = async (idEtudiant, decision) => {
    setTraitementEnCours(idEtudiant)
    setMessageDemande('')
    try {
      const res = await fetchAuth('/api/universiteEtudiant', {
        method: 'PATCH',
        body: JSON.stringify({ idEtudiant, decision })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors du traitement')
      setMessageDemande(data.message)
      await chargerEtudiants()
    } catch (err) {
      setMessageDemande(err.message)
    } finally {
      setTraitementEnCours(null)
    }
  }

  const niveauxList = useMemo(() => {
    const set = new Set()
    etudiants.forEach(e => e.niveauAcademique && set.add(e.niveauAcademique))
    return Array.from(set).sort()
  }, [etudiants])

  const etudiantsFiltres = useMemo(() => {
    let filtered = etudiants

    /* « aucune » vise les étudiants rattachés à l'établissement mais à
       aucun groupe : inscrits d'eux-mêmes, ou importés avant l'existence
       des promotions. Sans ce cas, ils disparaîtraient de l'écran. */
    if (filtrePromotion === 'aucune') {
      filtered = filtered.filter(e => !e.idPromotion)
    } else if (filtrePromotion !== 'all') {
      filtered = filtered.filter(e => String(e.idPromotion) === String(filtrePromotion))
    }

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

      {/* === Demandes de rattachement en attente ===
          Des étudiants se sont déclarés membres de cet établissement.
          C'est à l'université de confirmer : elle seule sait qui sont
          réellement ses étudiants. */}
      {!isLoading && demandes.length > 0 && (
        <>
          <PageTitle>
            Demandes de rattachement en attente ({demandes.length})
          </PageTitle>
          {messageDemande && <EmptyState>{messageDemande}</EmptyState>}
          <EtudiantsGrid>
            {demandes.map((d) => (
              <EtudiantCard key={d.idEtudiant}>
                <EtudiantHeader>
                  <EtudiantAvatar>
                    {d.photoProfil
                      ? <img src={d.photoProfil} alt="" />
                      : `${(d.prenomEtudiant || '?')[0]}${(d.nomEtudiant || '?')[0]}`}
                  </EtudiantAvatar>
                  <div>
                    <EtudiantName>{d.prenomEtudiant} {d.nomEtudiant}</EtudiantName>
                    <EtudiantLevel>{d.niveauAcademique || 'Niveau non précisé'}</EtudiantLevel>
                  </div>
                </EtudiantHeader>

                <EtudiantInfo>
                  <EtudiantInfoItem>Filière : {d.filiere || 'Non précisée'}</EtudiantInfoItem>
                  <EtudiantInfoItem>Spécialisation : {d.specialisation || 'Non précisée'}</EtudiantInfoItem>
                  <EtudiantInfoItem>Matricule : {d.matricule || 'Non précisé'}</EtudiantInfoItem>
                  <EtudiantInfoItem>{d.emailUtilisateur}</EtudiantInfoItem>
                </EtudiantInfo>

                <EtudiantFooter>
                  <ViewProfileButton
                    onClick={() => traiterDemande(d.idEtudiant, 'Valide')}
                    disabled={traitementEnCours === d.idEtudiant}
                  >
                    {traitementEnCours === d.idEtudiant ? 'Traitement...' : 'Valider'}
                  </ViewProfileButton>
                  <ViewProfileButton
                    onClick={() => traiterDemande(d.idEtudiant, 'Refuse')}
                    disabled={traitementEnCours === d.idEtudiant}
                  >
                    Refuser
                  </ViewProfileButton>
                </EtudiantFooter>
              </EtudiantCard>
            ))}
          </EtudiantsGrid>
        </>
      )}

      {/* ===== Les promotions, unité de gestion de l'établissement =====

          Une université raisonne en promotions, pas en individus. Une
          liste de plusieurs centaines de noms ne se pilote pas ; quelques
          groupes, si. */}
      {(promotions.length > 0 || sansPromotion > 0) && (
        <>
          <PageTitle style={{ fontSize: 19 }}>Mes promotions</PageTitle>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <BoutonPromotion $actif={filtrePromotion === 'all'}
              onClick={() => setFiltrePromotion('all')}>
              <strong>Toutes</strong>
              <span>{etudiants.length} étudiants</span>
            </BoutonPromotion>

            {promotions.map(p => (
              <BoutonPromotion key={p.idPromotion}
                $actif={String(filtrePromotion) === String(p.idPromotion)}
                onClick={() => setFiltrePromotion(p.idPromotion)}>
                <strong>{p.libelle}</strong>
                <span>{p.annee} · {p.effectif} étudiant{p.effectif > 1 ? 's' : ''}</span>
                {p.enAttenteActivation > 0 && (
                  <span style={{ color: '#b45309' }}>
                    {p.enAttenteActivation} compte{p.enAttenteActivation > 1 ? 's' : ''} à activer
                  </span>
                )}
                {p.enStage > 0 && (
                  <span style={{ color: '#15803d' }}>{p.enStage} en stage</span>
                )}
              </BoutonPromotion>
            ))}

            {sansPromotion > 0 && (
              <BoutonPromotion $actif={filtrePromotion === 'aucune'}
                onClick={() => setFiltrePromotion('aucune')}>
                <strong>Sans promotion</strong>
                <span>{sansPromotion} étudiant{sansPromotion > 1 ? 's' : ''}</span>
              </BoutonPromotion>
            )}
          </div>
        </>
      )}

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