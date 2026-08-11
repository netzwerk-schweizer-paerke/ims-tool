import { ListBlock } from '@/components/views/activity/view/list-block'
import { TaskList } from '@/payload-types'

type Props = {
  lists: (number | TaskList)[] | null | undefined
}

export const ListsGrid: React.FC<Props> = ({ lists }) => {
  if (!lists) {
    return null
  }
  return (
    <>
      {lists.map((list, i) => (
        <div className={'w-48'} key={i}>
          <ListBlock list={list} />
        </div>
      ))}
    </>
  )
}
