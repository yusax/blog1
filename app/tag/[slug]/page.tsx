import Pagination from '@/components/molecules/pagination'
import PostRecent from '@/components/organisms/postRecent'
import Sidebar from '@/components/organisms/sidebar'
import TitleMV from '@/components/organisms/titleMV'
import { defaultSettings } from '@/contants/defaultSettings'
import getData from '@/utils/getData'
import { ResolvingMetadata } from 'next'
import NotFound from '@/app/not-found'
import Error from '@/app/error'

type Props = {
  params: {
    slug: string,
  },
  searchParams: {
    draftKey: string,
  }
}

/** MetaData */
export async function generateMetadata({params}: Props, parent: ResolvingMetadata) {
  const parentData = await(parent)
  const settingsData = await getData('settings/')
  const tagEndpoint = `tag/${params.slug}/`
  const tagData = await getData(tagEndpoint)
  const previousPreview = parentData.openGraph?.images || []
  const favicon = settingsData.favicon
  const faviconUrl = favicon ? favicon.url : '/images/favicon.ico'

  // Title & description
  let titlePage = `《${tagData.name}》タグ一覧`
  let descriptionPage = `《${tagData.name}》タグの記事一覧ページです。`
  let siteName = `| ${settingsData.siteName}`
  if (tagData.status === 401) {
    titlePage = defaultSettings.serverError
    descriptionPage = ''
    siteName = ''
  }
  else if (tagData.status === 404) {
    titlePage = defaultSettings.pageNotFound
    descriptionPage = ''
  }
  const title = `${titlePage} ${siteName}`

  return {
    title: title,
    description: descriptionPage,
    openGraph: {
      title: title,
      images: [...previousPreview],
      type: 'article',
    },
    icons: {
      icon: [
        {
          url: faviconUrl,
          href: faviconUrl,
        }
      ]
    }
  }
}


async function TagPage({params, searchParams} : Props) {

  /** Get data */
  const draftKey = searchParams.draftKey
  const settingsData = await getData('settings/')
  const endpoint = `tag/${params.slug}${draftKey ? ('?draftKey=' + draftKey) : ''}`
  const microData = await getData(endpoint)
  
  const tagName = microData.name
  const tagId = microData.id
  const fields = defaultSettings.queryFields
  const postLimit = settingsData.postLimit || defaultSettings.postLimit
  const limitOffset = `limit=${postLimit}&offset=${0}`
  const filters = `filters=tags[contains]${tagId}`
  const postsEndpoint = `blogs?${filters}&${fields}&${limitOffset}`
  const postsData = await getData(postsEndpoint)

  const tagEndpoint = `tag/${params.slug}/`
  const tagData = await getData(tagEndpoint)
  
  // [MICROCMS_API_KEY] not valid
  if (tagData.status === 401) {
    return <Error />
  }
  // Page not found
  else if (tagData.status === 404) {
    return <NotFound />
  }
  
  return (
    <>
      <TitleMV title={tagName} />
      <div className="main__wrapper page--tag">
        <div className="main__container container">
          <div className="main__inner">
            <div className="main__content">
              <PostRecent articles={postsData.contents} />
              <Pagination totalCount={postsData.totalCount} basePath={`/tag/${params.slug}/`} pageCurrent={1} />
            </div>
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  )
}

export default TagPage