import { RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { LexicalDiffComponent as LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { FixedToolbarFeatureClient as FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ActivityIOField as ActivityIOField_bccc8bb52fd2478fa9350f3c68a200f6 } from 'src/components/graph/fields/graph/activities/io/activity-i-o-field'
import { ActivityTaskField as ActivityTaskField_a0957cc6c6bd29faf81e7216a2bd26dc } from 'src/components/graph/fields/graph/activities/task/activity-task-field'
import { BeforeListTableWrapper as BeforeListTableWrapper_5e61813b74874fdb52ca8e195ce6bf48 } from 'src/payload/collections/Activities/components/before-list-table-wrapper.tsx'
import { SimpleCustomButton as SimpleCustomButton_2603b30d3d3224d85d26ea360d78447b } from 'src/plugins/deeplTranslate/client/components/buttons/simple-custom-button'
import { ProcessInputOutputField as ProcessInputOutputField_86f6546ccb9b4d404295b8a255596215 } from 'src/components/graph/fields/graph/flows/io/process-input-output-field'
import { ProcessTaskField as ProcessTaskField_4398cb30c934d5d1617717da8602ea32 } from 'src/components/graph/fields/graph/flows/task/process-task-field'
import { ProcessTestField as ProcessTestField_228a1d3d551a14020bbe557cc231c339 } from 'src/components/graph/fields/graph/flows/test/process-test-field'
import { ProcessTaskParallelField as ProcessTaskParallelField_7e53e5f67e05b59712f3c0c3836b07aa } from 'src/components/graph/fields/graph/flows/parallel/process-task-parallel-field'
import { CloneTaskFlowsButton as CloneTaskFlowsButton_db9a6ec17d63d6a37511503e2c904d18 } from 'src/payload/collections/TaskFlow/components/clone-task-flows-button'
import { CloneTaskListsButton as CloneTaskListsButton_e0a7ff41c673461f8221cad6e22e6fd0 } from 'src/payload/collections/TaskList/components/clone-task-lists-button'
import { Icon as Icon_ffffee7b89973490816d209c4fec3a29 } from 'src/components/icon'
import { Logo as Logo_41750b0786ad8f0d7e0f700218d90b2f } from 'src/components/logo'
import { ActivityLandscapeLink as ActivityLandscapeLink_082780cf9027ba13a23f29fe079da870 } from 'src/components/activity-landscape-link'
import { OrganisationSelect as OrganisationSelect_281bbc373a891bfc2595a57cfb5a69cf } from 'src/components/organisation-select'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { FlowBlockView as FlowBlockView_b366da92bebaf7d6a5e4eaa1f457dca3 } from 'src/components/views/flow'
import { ListBlockView as ListBlockView_6b259556698f42eac9d0778fbbe1bee6 } from 'src/components/views/list'
import { ActivityBlockView as ActivityBlockView_4cab46728cc1ee02ddfbd1d7770f2ef0 } from 'src/components/views/activity/view'
import { ActivitiesView as ActivitiesView_2138b93d2cc56d1df1bfad938b66afc7 } from 'src/components/views/activity/overview'

export const importMap = {
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient": FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#BoldFeatureClient": BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#OrderedListFeatureClient": OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#UnorderedListFeatureClient": UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "src/components/graph/fields/graph/activities/io/activity-i-o-field#ActivityIOField": ActivityIOField_bccc8bb52fd2478fa9350f3c68a200f6,
  "src/components/graph/fields/graph/activities/task/activity-task-field#ActivityTaskField": ActivityTaskField_a0957cc6c6bd29faf81e7216a2bd26dc,
  "src/payload/collections/Activities/components/before-list-table-wrapper.tsx#BeforeListTableWrapper": BeforeListTableWrapper_5e61813b74874fdb52ca8e195ce6bf48,
  "src/plugins/deeplTranslate/client/components/buttons/simple-custom-button#SimpleCustomButton": SimpleCustomButton_2603b30d3d3224d85d26ea360d78447b,
  "src/components/graph/fields/graph/flows/io/process-input-output-field#ProcessInputOutputField": ProcessInputOutputField_86f6546ccb9b4d404295b8a255596215,
  "src/components/graph/fields/graph/flows/task/process-task-field#ProcessTaskField": ProcessTaskField_4398cb30c934d5d1617717da8602ea32,
  "src/components/graph/fields/graph/flows/test/process-test-field#ProcessTestField": ProcessTestField_228a1d3d551a14020bbe557cc231c339,
  "src/components/graph/fields/graph/flows/parallel/process-task-parallel-field#ProcessTaskParallelField": ProcessTaskParallelField_7e53e5f67e05b59712f3c0c3836b07aa,
  "src/payload/collections/TaskFlow/components/clone-task-flows-button#CloneTaskFlowsButton": CloneTaskFlowsButton_db9a6ec17d63d6a37511503e2c904d18,
  "src/payload/collections/TaskList/components/clone-task-lists-button#CloneTaskListsButton": CloneTaskListsButton_e0a7ff41c673461f8221cad6e22e6fd0,
  "src/components/icon#Icon": Icon_ffffee7b89973490816d209c4fec3a29,
  "src/components/logo#Logo": Logo_41750b0786ad8f0d7e0f700218d90b2f,
  "src/components/activity-landscape-link#ActivityLandscapeLink": ActivityLandscapeLink_082780cf9027ba13a23f29fe079da870,
  "src/components/organisation-select#OrganisationSelect": OrganisationSelect_281bbc373a891bfc2595a57cfb5a69cf,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "src/components/views/flow#FlowBlockView": FlowBlockView_b366da92bebaf7d6a5e4eaa1f457dca3,
  "src/components/views/list#ListBlockView": ListBlockView_6b259556698f42eac9d0778fbbe1bee6,
  "src/components/views/activity/view#ActivityBlockView": ActivityBlockView_4cab46728cc1ee02ddfbd1d7770f2ef0,
  "src/components/views/activity/overview#ActivitiesView": ActivitiesView_2138b93d2cc56d1df1bfad938b66afc7
}
