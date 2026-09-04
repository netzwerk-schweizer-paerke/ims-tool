import { ListBlock } from '@/components/views/activity/view/list-block'
import { ViewLinks } from '@/components/views/view-links'
import { TaskList } from '@/payload-types'

type Props = {
  links: ViewLinks
  lists: (number | TaskList)[] | null | undefined
}

export const ListsGrid = ({ links, lists }: Props) => {
  if (!lists) {
    return null
  }
  return (
    <>
      {lists.map((list, i) => (
        <div className={'w-48'} key={i}>
          <ListBlock links={links} list={list} />
        </div>
      ))}
    </>
  )
}
