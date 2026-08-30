'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth, getUtilisateur, logout } from '@/lib/auth'
import {
  DashboardContainer,
  NotificationBanner,
  LoadingState, ErrorState,
  AdminHeader, HeaderTitle, HeaderRight, AdminName, LogoutButton, HeaderAction,
  StatsGrid, StatCard, StatValue, StatLabel,
  TabsBar, TabButton,
  Toolbar, SearchInput,
  TableWrapper, Table, Th, Td, EmptyRow,
  StatutBadge, VerifyButton, UnverifyButton,
  ActionCell, DetailsButton,
  ModalOverlay, ModalCard, ModalHeader, ModalTitle, ModalClose,
  ModalBody, ModalLogo, DetailRow, DetailLabel, DetailValue, ModalFooter,
  ChartsGrid, ChartCard, ChartTitle, ChartSubtitle
} from '@/components/styleAdminDashboard'

import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('entreprises')
  const [updatingId, setUpdatingId] = useState(null)
  const [search, setSearch] = useState('')
  const [detailItem, setDetailItem] = useState(null)
  const [detailType, setDetailType] = useState(null)
  const [notification, setNotification] = useState(null)

  const admin = getUtilisateur()

  const afficherNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const fetchData = async () => {
    try {
      const res = await fetchAuth('/api/admin/donnees')
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || `Erreur ${res.status}`)
      setData(result)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleVerification = async (type, id, nouveauStatut) => {
    setUpdatingId(`${type}-${id}`)
    try {
      const res = await fetchAuth('/api/admin/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, estVerifie: nouveauStatut })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || `Erreur ${res.status}`)

      const idKey = type === 'entreprise' ? 'idEntreprise' : 'idUniversite'
      const cle = type === 'entreprise' ? 'entreprises' : 'universites'

      setData(prev => ({
        ...prev,
        [cle]: prev[cle].map(item =>
          item[idKey] === id ? { ...item, estVerifie: nouveauStatut } : item
        )
      }))

      setDetailItem(prev =>
        prev && prev[idKey] === id ? { ...prev, estVerifie: nouveauStatut } : prev
      )

      if (nouveauStatut === true) {
        if (result.emailEnvoye) {
          afficherNotification(
            '✓ Compte validé — email de confirmation envoyé au destinataire.',
            'success'
          )
        } else {
          afficherNotification(
            "✓ Compte validé, mais l'email n'a pas pu être envoyé (vérifiez la connexion / la configuration).",
            'warning'
          )
        }
      } else {
        afficherNotification('Vérification retirée.', 'info')
      }
    } catch (err) {
      afficherNotification('Erreur : ' + err.message, 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const openDetails = (type, item) => {
    setDetailType(type)
    setDetailItem(item)
  }

  const handleLogout = () => { logout() }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const listeFiltree = useMemo(() => {
    if (!data) return []
    const s = search.toLowerCase().trim()
    const liste = data[activeTab] || []
    if (!s) return liste

    return liste.filter(item => {
      if (activeTab === 'entreprises')
        return item.nomEntreprise?.toLowerCase().includes(s) ||
               item.emailUtilisateur?.toLowerCase().includes(s) ||
               item.secteurActivitePrincipal?.toLowerCase().includes(s)
      if (activeTab === 'universites')
        return item.nomUniversite?.toLowerCase().includes(s) ||
               item.emailUtilisateur?.toLowerCase().includes(s) ||
               item.ville?.toLowerCase().includes(s)
      if (activeTab === 'etudiants')
        return item.nomEtudiant?.toLowerCase().includes(s) ||
               item.prenomEtudiant?.toLowerCase().includes(s) ||
               item.emailUtilisateur?.toLowerCase().includes(s) ||
               item.filiere?.toLowerCase().includes(s)
      if (activeTab === 'offres')
        return item.titre?.toLowerCase().includes(s) ||
               item.nomEntreprise?.toLowerCase().includes(s) ||
               item.domaine?.toLowerCase().includes(s)
      return true
    })
  }, [data, activeTab, search])

  if (isLoading) {
    return <DashboardContainer><LoadingState>Chargement du tableau de bord...</LoadingState></DashboardContainer>
  }

  if (error || !data) {
    return (
      <DashboardContainer>
        <ErrorState>
          <h2>❌ Erreur</h2>
          <p>{error || 'Impossible de charger les données'}</p>
        </ErrorState>
      </DashboardContainer>
    )
  }

  const { stats } = data

  const tabs = [
    { key: 'stats', label: '📊 Statistiques' },
    { key: 'entreprises', label: `Entreprises (${data.entreprises.length})` },
    { key: 'universites', label: `Universités (${data.universites.length})` },
    { key: 'etudiants', label: `Étudiants (${data.etudiants.length})` },
    { key: 'offres', label: `Offres (${data.offres.length})` }
  ]

  return (
    <DashboardContainer>
      {notification && (
        <NotificationBanner $type={notification.type}>
          {notification.message}
        </NotificationBanner>
      )}
      <AdminHeader>
        <HeaderTitle>🛡️ Tableau de bord administrateur</HeaderTitle>
        <HeaderRight>
          <AdminName>{admin?.prenomAdmin} {admin?.nomAdmin}</AdminName>
          {/* La création d'un administrateur n'était atteignable par
              aucun lien : la page existait sans que rien n'y mène. */}
          <HeaderAction onClick={() => router.push('/pages/adminRegistreInfo')}>
            + Administrateur
          </HeaderAction>
          <LogoutButton onClick={handleLogout}>Déconnexion</LogoutButton>
        </HeaderRight>
      </AdminHeader>

      <StatsGrid>
        <StatCard><StatValue>{stats.totalEtudiants}</StatValue><StatLabel>Étudiants</StatLabel></StatCard>
        <StatCard><StatValue>{stats.totalEntreprises}</StatValue><StatLabel>Entreprises</StatLabel></StatCard>
        <StatCard><StatValue>{stats.totalUniversites}</StatValue><StatLabel>Universités</StatLabel></StatCard>
        <StatCard><StatValue>{stats.totalOffres}</StatValue><StatLabel>Offres</StatLabel></StatCard>
        <StatCard><StatValue>{stats.totalCandidatures}</StatValue><StatLabel>Candidatures</StatLabel></StatCard>
        <StatCard $alert={Number(stats.entreprisesEnAttente) + Number(stats.universitesEnAttente) > 0}>
          <StatValue>{Number(stats.entreprisesEnAttente) + Number(stats.universitesEnAttente)}</StatValue>
          <StatLabel>En attente de validation</StatLabel>
        </StatCard>
      </StatsGrid>

      <TabsBar>
        {tabs.map(t => (
          <TabButton key={t.key} $active={activeTab === t.key}
            onClick={() => { setActiveTab(t.key); setSearch('') }}>
            {t.label}
          </TabButton>
        ))}
      </TabsBar>

      {/* Cache la barre de recherche dans l'onglet stats */}
      {activeTab !== 'stats' && (
        <Toolbar>
          <SearchInput type="text" placeholder="🔍 Rechercher..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </Toolbar>
      )}

      <TableWrapper>
        {/* ========== 1. STATISTIQUES (GRAPHIQUES) ========== */}
        {activeTab === 'stats' && (
          <ChartsGrid>
            {/* === 1. BAR CHART : Répartition par type === */}
            <ChartCard>
              <ChartTitle>📊 Répartition des utilisateurs</ChartTitle>
              <ChartSubtitle>Nombre total par type de compte</ChartSubtitle>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[
                    { type: 'Étudiants', total: stats.totalEtudiants, fill: '#10b981' },
                    { type: 'Entreprises', total: stats.totalEntreprises, fill: '#6366f1' },
                    { type: 'Universités', total: stats.totalUniversites, fill: '#3b82f6' }
                  ]}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#475569' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* === 2. PIE CHART : Statut de vérification === */}
            <ChartCard>
              <ChartTitle>🥧 Comptes en attente vs vérifiés</ChartTitle>
              <ChartSubtitle>Entreprises et universités confondues</ChartSubtitle>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Vérifiés',
                        value:
                          (Number(stats.totalEntreprises) - Number(stats.entreprisesEnAttente)) +
                          (Number(stats.totalUniversites) - Number(stats.universitesEnAttente))
                      },
                      {
                        name: 'En attente',
                        value:
                          Number(stats.entreprisesEnAttente) + Number(stats.universitesEnAttente)
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* === 3. LINE CHART : Évolution sur 12 mois === */}
            <ChartCard $wide>
              <ChartTitle>📈 Évolution des inscriptions</ChartTitle>
              <ChartSubtitle>Nouveaux comptes sur les 12 derniers mois</ChartSubtitle>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={data.inscriptionsParMois || []}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#475569' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Étudiants" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Entreprises" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Universités" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </ChartsGrid>
        )}

        {/* ========== 2. ENTREPRISES ========== */}
        {activeTab === 'entreprises' && (
          <Table>
            <thead>
              <tr>
                <Th>Nom</Th><Th>Secteur</Th><Th>Email</Th>
                <Th>Inscrite le</Th><Th>Statut</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {listeFiltree.length === 0 ? (
                <tr><EmptyRow colSpan={6}>Aucune entreprise.</EmptyRow></tr>
              ) : listeFiltree.map(e => (
                <tr key={e.idEntreprise}>
                  <Td><strong>{e.nomEntreprise}</strong></Td>
                  <Td>{e.secteurActivitePrincipal || '—'}</Td>
                  <Td>{e.emailUtilisateur}</Td>
                  <Td>{formatDate(e.dateInscription)}</Td>
                  <Td>
                    <StatutBadge $variant={e.estVerifie ? 'verifie' : 'attente'}>
                      {e.estVerifie ? '✓ Vérifiée' : 'En attente'}
                    </StatutBadge>
                  </Td>
                  <Td>
                    <ActionCell>
                      <DetailsButton onClick={() => openDetails('entreprise', e)}>
                        👁 Détails
                      </DetailsButton>
                      {e.estVerifie ? (
                        <UnverifyButton
                          disabled={updatingId === `entreprise-${e.idEntreprise}`}
                          onClick={() => handleVerification('entreprise', e.idEntreprise, false)}
                        >Retirer</UnverifyButton>
                      ) : (
                        <VerifyButton
                          disabled={updatingId === `entreprise-${e.idEntreprise}`}
                          onClick={() => handleVerification('entreprise', e.idEntreprise, true)}
                        >
                          {updatingId === `entreprise-${e.idEntreprise}` ? '...' : '✓ Valider'}
                        </VerifyButton>
                      )}
                    </ActionCell>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* ========== 3. UNIVERSITÉS ========== */}
        {activeTab === 'universites' && (
          <Table>
            <thead>
              <tr>
                <Th>Nom</Th><Th>Sigle</Th><Th>Ville</Th>
                <Th>Inscrite le</Th><Th>Statut</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {listeFiltree.length === 0 ? (
                <tr><EmptyRow colSpan={6}>Aucune université.</EmptyRow></tr>
              ) : listeFiltree.map(u => (
                <tr key={u.idUniversite}>
                  <Td><strong>{u.nomUniversite}</strong></Td>
                  <Td>{u.sigleUniversitaire || '—'}</Td>
                  <Td>{u.ville || '—'}</Td>
                  <Td>{formatDate(u.dateInscription)}</Td>
                  <Td>
                    <StatutBadge $variant={u.estVerifie ? 'verifie' : 'attente'}>
                      {u.estVerifie ? '✓ Vérifiée' : 'En attente'}
                    </StatutBadge>
                  </Td>
                  <Td>
                    <ActionCell>
                      <DetailsButton onClick={() => openDetails('universite', u)}>
                        👁 Détails
                      </DetailsButton>
                      {u.estVerifie ? (
                        <UnverifyButton
                          disabled={updatingId === `universite-${u.idUniversite}`}
                          onClick={() => handleVerification('universite', u.idUniversite, false)}
                        >Retirer</UnverifyButton>
                      ) : (
                        <VerifyButton
                          disabled={updatingId === `universite-${u.idUniversite}`}
                          onClick={() => handleVerification('universite', u.idUniversite, true)}
                        >
                          {updatingId === `universite-${u.idUniversite}` ? '...' : '✓ Valider'}
                        </VerifyButton>
                      )}
                    </ActionCell>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* ========== 4. ÉTUDIANTS ========== */}
        {activeTab === 'etudiants' && (
          <Table>
            <thead>
              <tr>
                <Th>Nom complet</Th><Th>Email</Th><Th>Filière</Th>
                <Th>Niveau</Th><Th>Université</Th><Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {listeFiltree.length === 0 ? (
                <tr><EmptyRow colSpan={6}>Aucun étudiant.</EmptyRow></tr>
              ) : listeFiltree.map(e => (
                <tr key={e.idEtudiant}>
                  <Td><strong>{e.prenomEtudiant} {e.nomEtudiant}</strong></Td>
                  <Td>{e.emailUtilisateur}</Td>
                  <Td>{e.filiere || '—'}</Td>
                  <Td>{e.niveauAcademique || '—'}</Td>
                  <Td>{e.nomUniversite || '—'}</Td>
                  <Td>
                    <StatutBadge $variant={e.estActif ? 'verifie' : 'inactif'}>
                      {e.estActif ? 'Actif' : 'Inactif'}
                    </StatutBadge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* ========== 5. OFFRES ========== */}
        {activeTab === 'offres' && (
          <Table>
            <thead>
              <tr>
                <Th>Titre</Th><Th>Entreprise</Th><Th>Domaine</Th>
                <Th>Ville</Th><Th>Type</Th><Th>Statut</Th><Th>Publiée le</Th>
              </tr>
            </thead>
            <tbody>
              {listeFiltree.length === 0 ? (
                <tr><EmptyRow colSpan={7}>Aucune offre.</EmptyRow></tr>
              ) : listeFiltree.map(o => (
                <tr key={o.idOffre}>
                  <Td><strong>{o.titre}</strong></Td>
                  <Td>{o.nomEntreprise}</Td>
                  <Td>{o.domaine || '—'}</Td>
                  <Td>{o.ville || '—'}</Td>
                  <Td>{o.typeStage || '—'}</Td>
                  <Td>
                    <StatutBadge $variant={o.statut === 'Active' ? 'verifie' : 'attente'}>
                      {o.statut}
                    </StatutBadge>
                  </Td>
                  <Td>{formatDate(o.datePublication)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableWrapper>

      {/* === MODAL DÉTAILS === */}
      {detailItem && (
        <ModalOverlay onClick={() => setDetailItem(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {detailType === 'entreprise'
                  ? "🏢 Détails de l'entreprise"
                  : "🎓 Détails de l'université"}
              </ModalTitle>
              <ModalClose onClick={() => setDetailItem(null)}>✕</ModalClose>
            </ModalHeader>

            <ModalBody>
              {detailItem.logo && <ModalLogo src={detailItem.logo} alt="logo" />}

              {detailType === 'entreprise' ? (
                <>
                  <DetailRow><DetailLabel>Nom de l'entreprise</DetailLabel><DetailValue>{detailItem.nomEntreprise}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Email</DetailLabel><DetailValue>{detailItem.emailUtilisateur}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>N° Identification Fiscale</DetailLabel><DetailValue>{detailItem.numeroIdentificationFiscal || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>N° STAT</DetailLabel><DetailValue>{detailItem.numeroStat || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Forme juridique</DetailLabel><DetailValue>{detailItem.formeJuridique || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Secteur d'activité</DetailLabel><DetailValue>{detailItem.secteurActivitePrincipal || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Adresse du siège social</DetailLabel><DetailValue>{detailItem.adresseSiegeSocial || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Téléphone principal</DetailLabel><DetailValue>{detailItem.telephonePrincipal || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Téléphone secondaire</DetailLabel><DetailValue>{detailItem.telephoneSecondaire || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Site web</DetailLabel><DetailValue>{detailItem.siteWeb || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Réseaux sociaux</DetailLabel><DetailValue>{detailItem.reseauxSociaux || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Description</DetailLabel><DetailValue>{detailItem.description || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Inscrite le</DetailLabel><DetailValue>{formatDate(detailItem.dateInscription)}</DetailValue></DetailRow>
                  <DetailRow>
                    <DetailLabel>Statut</DetailLabel>
                    <DetailValue>
                      <StatutBadge $variant={detailItem.estVerifie ? 'verifie' : 'attente'}>
                        {detailItem.estVerifie ? '✓ Vérifiée' : 'En attente'}
                      </StatutBadge>
                      {detailItem.estVerifie && detailItem.dateVerification &&
                        ` le ${formatDate(detailItem.dateVerification)}`}
                    </DetailValue>
                  </DetailRow>
                </>
              ) : (
                <>
                  <DetailRow><DetailLabel>Nom de l'université</DetailLabel><DetailValue>{detailItem.nomUniversite}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Email</DetailLabel><DetailValue>{detailItem.emailUtilisateur}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Sigle universitaire</DetailLabel><DetailValue>{detailItem.sigleUniversitaire || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Ville</DetailLabel><DetailValue>{detailItem.ville || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Adresse</DetailLabel><DetailValue>{detailItem.adresseUniversite || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Téléphone</DetailLabel><DetailValue>{detailItem.telephoneUniversite || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Site web</DetailLabel><DetailValue>{detailItem.siteWeb || '—'}</DetailValue></DetailRow>
                  <DetailRow><DetailLabel>Inscrite le</DetailLabel><DetailValue>{formatDate(detailItem.dateInscription)}</DetailValue></DetailRow>
                  <DetailRow>
                    <DetailLabel>Statut</DetailLabel>
                    <DetailValue>
                      <StatutBadge $variant={detailItem.estVerifie ? 'verifie' : 'attente'}>
                        {detailItem.estVerifie ? '✓ Vérifiée' : 'En attente'}
                      </StatutBadge>
                      {detailItem.estVerifie && detailItem.dateVerification &&
                        ` le ${formatDate(detailItem.dateVerification)}`}
                    </DetailValue>
                  </DetailRow>
                </>
              )}
            </ModalBody>

            <ModalFooter>
              {(() => {
                const idKey = detailType === 'entreprise' ? 'idEntreprise' : 'idUniversite'
                const id = detailItem[idKey]
                const enCours = updatingId === `${detailType}-${id}`
                return detailItem.estVerifie ? (
                  <UnverifyButton disabled={enCours}
                    onClick={() => handleVerification(detailType, id, false)}>
                    Retirer la vérification
                  </UnverifyButton>
                ) : (
                  <VerifyButton disabled={enCours}
                    onClick={() => handleVerification(detailType, id, true)}>
                    {enCours ? 'Traitement...' : '✓ Valider ce compte'}
                  </VerifyButton>
                )
              })()}
            </ModalFooter>
          </ModalCard>
        </ModalOverlay>
      )}
    </DashboardContainer>
  )
}