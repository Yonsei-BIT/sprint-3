import { NextRequest, NextResponse } from 'next/server'

interface KakaoDoc {
  place_name: string; address_name: string; category_name: string
  distance: string; phone: string; place_url: string; x: string; y: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location') ?? ''
  const menu = searchParams.get('menu') ?? ''

  if (!menu) return NextResponse.json({ restaurants: [] })

  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
  if (!key) return NextResponse.json({ restaurants: [] })

  try {
    const query = location ? `${location} ${menu}` : menu
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=15`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    )
    const data = await res.json()
    const restaurants = (data.documents ?? []).map((d: KakaoDoc) => ({
      name: d.place_name,
      address: d.address_name,
      distance: d.distance || '',
      phone: d.phone || '',
      url: d.place_url || '',
      lat: parseFloat(d.y),
      lng: parseFloat(d.x),
    }))
    return NextResponse.json({ restaurants })
  } catch {
    return NextResponse.json({ restaurants: [] })
  }
}
