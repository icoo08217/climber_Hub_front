const CLIMB_MAP_PEAKERS = 'https://climbmap.life/places/kr/brands/peakers'
const CLIMB_MAP_SEOUL_FOREST = 'https://climbmap.life/places/kr/brands/seoul-forest'
const THE_CLIMB_WEBSITE = 'https://theclimb.co.kr/'

export const SEOUL_CURATED_GYMS = [
  gym('peakers-jongno', '피커스 종로점', '서울 종로구 돈화문로5가길 1', 37.5716678, 126.9915115, {
    phone: '02-526-8862',
    detailsUrl: CLIMB_MAP_PEAKERS,
  }),
  gym('peakers-guro', '피커스 구로점', '서울 구로구 구로중앙로 152', 37.5011249, 126.8827727, {
    detailsUrl: CLIMB_MAP_PEAKERS,
  }),
  gym('peakers-sinchon', '피커스 신촌점', '서울 서대문구 신촌로 129', 37.5565734, 126.940312, {
    detailsUrl: CLIMB_MAP_PEAKERS,
  }),
  gym(
    'seoul-forest-guro',
    '서울숲클라이밍 구로점',
    '서울 구로구 디지털로 300',
    37.4845924,
    126.8963929,
    {
      phone: '010-3374-2704',
      detailsUrl: CLIMB_MAP_SEOUL_FOREST,
    },
  ),
  gym(
    'seoul-forest-jongno',
    '서울숲클라이밍 종로점',
    '서울 종로구 수표로 96',
    37.5697586,
    126.9896402,
    {
      detailsUrl: CLIMB_MAP_SEOUL_FOREST,
    },
  ),
  gym(
    'seoul-forest-jamsil',
    '서울숲클라이밍 잠실점',
    '서울 송파구 백제고분로7길 49',
    37.5109238,
    127.0843379,
    {
      detailsUrl: CLIMB_MAP_SEOUL_FOREST,
    },
  ),
  gym(
    'seoul-forest-yeongdeungpo',
    '서울숲클라이밍 영등포점',
    '서울 영등포구 문래로 164',
    37.5178032,
    126.9000578,
    {
      detailsUrl: CLIMB_MAP_SEOUL_FOREST,
    },
  ),
  gym('the-climb-sillim', '더클라임 신림점', '서울 관악구 신원로 35', 37.4822801, 126.9290378, {
    phone: '02-877-8821',
    website: THE_CLIMB_WEBSITE,
  }),
  gym('the-climb-yeonnam', '더클라임 연남점', '서울 마포구 양화로 186', 37.557679, 126.925842, {
    website: THE_CLIMB_WEBSITE,
  }),
  gym(
    'the-climb-seongsu',
    '더클라임 성수점',
    '서울 성동구 아차산로17길 49',
    37.5467684,
    127.0652793,
    {
      website: THE_CLIMB_WEBSITE,
    },
  ),
  gym('the-climb-mullae', '더클라임 문래점', '서울 영등포구 당산로 63', 37.5253085, 126.8965943, {
    website: THE_CLIMB_WEBSITE,
  }),
  gym('the-climb-isu', '더클라임 이수점', '서울 동작구 동작대로 59', 37.5053107, 126.9802554, {
    website: THE_CLIMB_WEBSITE,
  }),
  gym(
    'the-climb-yangjae',
    '더클라임 양재점',
    '서울 강남구 남부순환로 2615',
    37.4851093,
    127.0357376,
    {
      website: THE_CLIMB_WEBSITE,
    },
  ),
  gym('the-climb-sadang', '더클라임 사당점', '서울 관악구 과천대로 939', 37.4743726, 126.9814277, {
    website: THE_CLIMB_WEBSITE,
  }),
  gym('the-climb-magok', '더클라임 마곡점', '서울 강서구 마곡동로 62', 37.5652843, 126.8294298, {
    website: THE_CLIMB_WEBSITE,
  }),
  gym(
    'the-climb-nonhyeon',
    '더클라임 논현점',
    '서울 서초구 강남대로 519',
    37.5081672,
    127.0220743,
    {
      website: THE_CLIMB_WEBSITE,
    },
  ),
  gym(
    'the-climb-gangnam',
    '더클라임 강남점',
    '서울 강남구 테헤란로8길 21',
    37.4975932,
    127.0320012,
    {
      website: THE_CLIMB_WEBSITE,
    },
  ),
  gym(
    'onfleek-cheonho',
    '온플릭 클라이밍',
    '서울 강동구 천호동 425-5 지하 1층',
    37.53627,
    127.132469,
    {
      phone: '02-486-6806',
      website: 'https://www.onfleekclimbing.com/',
    },
  ),
  gym(
    'off-the-wall-itaewon',
    '오프더월 클라이밍',
    '서울 용산구 이태원로 190 지하 2층',
    37.5343559,
    126.9951485,
    {
      phone: '02-6958-7796',
      website: 'https://www.instagram.com/offthewallclimbing_itaewon/',
    },
  ),
]

function gym(id, name, address, latitude, longitude, overrides = {}) {
  return {
    id: `curated-${id}`,
    name,
    address,
    phone: '',
    category: '실내 클라이밍 · 볼더링',
    latitude,
    longitude,
    website: '',
    detailsUrl: '',
    detailsLabel: '장소 정보 보기',
    source: 'curated',
    ...overrides,
  }
}
