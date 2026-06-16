export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Farm, FarmContact, FarmContactWithCount } from '@/types/farm'
import FarmClientShell from './FarmClientShell'

export default async function FarmPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: upsertedFarm, error: farmError } = await supabase
    .from('farms')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })
    .select()
    .single<Farm>()

  if (farmError || !upsertedFarm) {
    const { data: existingFarm } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .single<Farm>()

    if (!existingFarm) {
      return (
        <div className="flex min-h-screen items-center justify-center" style={{ background: '#f5ede0' }}>
          <p style={{ color: '#6b4c0a' }}>農園の読み込みに失敗しました。</p>
        </div>
      )
    }

    return <FarmData farm={existingFarm} />
  }

  return <FarmData farm={upsertedFarm} />
}

type ConfirmedCountRow = {
  farm_contact_id: string
  count: number
}

async function FarmData({ farm }: { farm: Farm }) {
  const supabase = await createSupabaseServerClient()

  const { data: contacts } = await supabase
    .from('farm_contacts')
    .select('*')
    .eq('farm_id', farm.id)
    .order('created_at', { ascending: true })
    .returns<FarmContact[]>()

  const farmContacts: FarmContact[] = contacts ?? []

  let confirmedCounts: ConfirmedCountRow[] = []
  let pendingCounts: ConfirmedCountRow[] = []
  let repliedCounts: ConfirmedCountRow[] = []

  if (farmContacts.length > 0) {
    const contactIds = farmContacts.map((c) => c.id)

    const [{ data: confirmedData }, { data: pendingData }, { data: repliedData }] = await Promise.all([
      // BUG-03 fix: count confirmed_index OR manually_confirmed
      supabase
        .from('meetings')
        .select('farm_contact_id')
        .in('farm_contact_id', contactIds)
        .or('confirmed_index.not.is.null,manually_confirmed.eq.true')
        .returns<{ farm_contact_id: string }[]>(),
      supabase
        .from('meetings')
        .select('farm_contact_id')
        .in('farm_contact_id', contactIds)
        .is('confirmed_index', null)
        .returns<{ farm_contact_id: string }[]>(),
      supabase
        .from('meetings')
        .select('farm_contact_id')
        .in('farm_contact_id', contactIds)
        .not('replied_at', 'is', null)
        .returns<{ farm_contact_id: string }[]>(),
    ])

    const toCountRows = (rows: { farm_contact_id: string }[] | null): ConfirmedCountRow[] => {
      const map: Record<string, number> = {}
      for (const row of rows ?? []) {
        if (row.farm_contact_id) {
          map[row.farm_contact_id] = (map[row.farm_contact_id] ?? 0) + 1
        }
      }
      return Object.entries(map).map(([farm_contact_id, count]) => ({ farm_contact_id, count }))
    }

    confirmedCounts = toCountRows(confirmedData)
    pendingCounts = toCountRows(pendingData)
    repliedCounts = toCountRows(repliedData)
  }

  const farmContactsWithCount: FarmContactWithCount[] = farmContacts.map((c) => ({
    ...c,
    confirmedCount: confirmedCounts.find((r) => r.farm_contact_id === c.id)?.count ?? 0,
    pendingCount: pendingCounts.find((r) => r.farm_contact_id === c.id)?.count ?? 0,
    repliedCount: repliedCounts.find((r) => r.farm_contact_id === c.id)?.count ?? 0,
  }))

  return <FarmClientShell contacts={farmContactsWithCount} />
}
