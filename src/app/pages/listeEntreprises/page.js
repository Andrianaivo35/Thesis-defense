'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppNavbar from '@/components/appNavbar'
import { Building2, BadgeCheck, MapPin, Briefcase, ArrowRight, Search } from 'lucide-react'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  FiltersBar, FilterButton,
  CandidatureList, CandidatureCard, CardHeader,
  OffreTitre, EntrepriseNom, ScoreBadge,
  CardMeta, MetaItem, CardFooter, ActionButton,
  EmptyState, LoadingState
} from '@/components/styleEtudiantCandidature'

/* Cette page consommait une route API qui n'avait aucun consommateur :
   /api/listeEntreprises existait, était paginée et nettoyée, mais aucune
   page ne l'appelait. Le menu étudiant référençait par ailleurs
   /pages/listeEntreprises, qui n'existait pas. */
export default function ListeEntreprises() {
  const router = useRouter()
  const [entreprises, setEntreprises] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [recherche, setRecherche] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const minuteur = setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), taille: '20' })
        if (recherche.trim()) params.set('recherche', recherche.trim())
        const res = await fetch(`/api/listeEntreprises?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Chargement impossible')
        setEntreprises(data.entreprises || [])
        setPagination(data.pagination)
      } catch (err) {
        setErreur(err.message)
      } finally {
        setIsLoading(false)
      }
    }, recherche ? 350 : 0)
    return () => clearTimeout(minuteur)
  }, [page, recherche])

  useEffect(() => { setPage(1) }, [recherche])

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <Building2 size={24} strokeWidth={2} />
            Les entreprises
          </PageTitle>
          <PageSubtitle>
            Découvrez les entreprises présentes sur Stage Share et leurs offres de stage.
          </PageSubtitle>
        </PageHeader>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search
            size={16}
            strokeWidth={2}
            style={{ position: 'absolute', left: 14, top: 13, color: '#94a3b8' }}
          />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par nom, secteur ou description..."
            style={{
              width: '100%', padding: '11px 14px 11px 40px', fontSize: 14,
              border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none'
            }}
          />
        </div>

        {isLoading ? (
          <LoadingState>Chargement des entreprises...</LoadingState>
        ) : erreur ? (
          <EmptyState>{erreur}</EmptyState>
        ) : entreprises.length === 0 ? (
          <EmptyState>
            {recherche
              ? 'Aucune entreprise ne correspond à votre recherche.'
              : 'Aucune entreprise inscrite pour le moment.'}
          </EmptyState>
        ) : (
          <>
            <PageTitle style={{ fontSize: 18 }}>
              {pagination ? `${pagination.total} entreprise${pagination.total > 1 ? 's' : ''}` : ''}
            </PageTitle>

            <CandidatureList>
              {entreprises.map(e => (
                <CandidatureCard key={e.idEntreprise}>
                  <CardHeader>
                    <div>
                      <OffreTitre>{e.nomEntreprise}</OffreTitre>
                      <EntrepriseNom>
                        <Briefcase size={14} strokeWidth={2} />
                        {e.secteurActivitePrincipal || 'Secteur non précisé'}
                      </EntrepriseNom>
                    </div>
                    {e.estVerifie && (
                      <ScoreBadge>
                        <BadgeCheck size={13} strokeWidth={2.5} />
                        Vérifiée
                      </ScoreBadge>
                    )}
                  </CardHeader>

                  {e.description && (
                    <CardMeta>
                      <MetaItem style={{ display: 'block', lineHeight: 1.5 }}>
                        {e.description.length > 180
                          ? `${e.description.slice(0, 180)}...`
                          : e.description}
                      </MetaItem>
                    </CardMeta>
                  )}

                  <CardMeta>
                    {e.adresseSiegeSocial && (
                      <MetaItem>
                        <MapPin size={13} strokeWidth={2} />
                        {e.adresseSiegeSocial}
                      </MetaItem>
                    )}
                    <MetaItem>
                      {Number(e.nombreOffresActives ?? 0)} offre
                      {Number(e.nombreOffresActives ?? 0) > 1 ? 's' : ''} active
                      {Number(e.nombreOffresActives ?? 0) > 1 ? 's' : ''}
                    </MetaItem>
                  </CardMeta>

                  <CardFooter>
                    <span />
                    <ActionButton
                      onClick={() => router.push(`/pages/entrepriseProfil/${e.idEntreprise}`)}
                    >
                      Voir le profil
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </ActionButton>
                  </CardFooter>
                </CandidatureCard>
              ))}
            </CandidatureList>

            {pagination && pagination.nombrePages > 1 && (
              <FiltersBar style={{ justifyContent: 'center', marginTop: 24 }}>
                <FilterButton
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.aPrecedent}
                >
                  Précédent
                </FilterButton>
                <FilterButton $actif>
                  Page {pagination.page} sur {pagination.nombrePages}
                </FilterButton>
                <FilterButton
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.aSuivant}
                >
                  Suivant
                </FilterButton>
              </FiltersBar>
            )}
          </>
        )}
      </PageContainer>
    </>
  )
}
