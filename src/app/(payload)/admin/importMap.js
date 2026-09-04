import { RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { LexicalDiffComponent as LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { FixedToolbarFeatureClient as FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ActivityIOField as ActivityIOField_caf9a311801e7db98fb5e995e8a2596d } from '@/components/graph/fields/graph/activities/io/activity-i-o-field'
import { ActivityTaskField as ActivityTaskField_6665d552f7f6a0ad37f39384c6c9f950 } from '@/components/graph/fields/graph/activities/task/activity-task-field'
import { BeforeListTableWrapper as BeforeListTableWrapper_74592d2078933a5095f41d31c1f58f8d } from '@/payload/collections/Activities/components/before-list-table-wrapper'
import { DocumentHealthButton as DocumentHealthButton_8076ad28c6e6c7ac777a780312e306b0 } from '@/payload/components/health/document-health-button'
import { SimpleCustomButton as SimpleCustomButton_60d2bab7b2aa60d4c6b0bb74d5c9870f } from '@/plugins/deeplTranslate/client/components/buttons/simple-custom-button'
import { DocumentUsageField as DocumentUsageField_d8674a9ebef88de20dbcc7c240989f48 } from '@/payload/components/document-usage/document-usage-field'
import { ProcessInputOutputField as ProcessInputOutputField_7dfabc5f295cb2097425696bedb6f5db } from '@/components/graph/fields/graph/flows/io/process-input-output-field'
import { ProcessTaskField as ProcessTaskField_322b2d058edf905cfc0862e78bfae81e } from '@/components/graph/fields/graph/flows/task/process-task-field'
import { ProcessTestField as ProcessTestField_1b1fa1413e304a6d3a95c1ca84726387 } from '@/components/graph/fields/graph/flows/test/process-test-field'
import { ProcessTaskParallelField as ProcessTaskParallelField_ce11f6fca5c05bd2d5b0507aec04ab55 } from '@/components/graph/fields/graph/flows/parallel/process-task-parallel-field'
import { CloneTaskFlowsButton as CloneTaskFlowsButton_3140b54a675ed487f54a48d38a32bb67 } from '@/payload/collections/TaskFlow/components/clone-task-flows-button'
import { CloneTaskListsButton as CloneTaskListsButton_812b2d715941e8897faa8c83c55fa333 } from '@/payload/collections/TaskList/components/clone-task-lists-button'
import { Icon as Icon_f8022cf35b3d492829ec1a405bd134e9 } from '@/components/icon'
import { Logo as Logo_7a89b5675912f3f4f82dd41bbb03d52e } from '@/components/logo'
import { ActivityLandscapeLink as ActivityLandscapeLink_1f583f1712000b1eebb17dfdc7ea52f5 } from '@/components/activity-landscape-link'
import { OrganisationSelect as OrganisationSelect_821016dd90dbfccf78f9ba146644dd1e } from '@/components/organisation-select'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { ActivitiesView as ActivitiesView_027ca867d2163c8ffc7d59a1792ce0a7 } from '@/components/views/activity/overview'
import { ActivityBlockView as ActivityBlockView_f343c9fa1808ff4f8c080c4cae00aecb } from '@/components/views/activity/view'
import { FlowBlockView as FlowBlockView_e835b55e87103a9e238abc92e73cdb06 } from '@/components/views/flow'
import { ListBlockView as ListBlockView_30dbbeee43bcb0357f44c70df4f960f4 } from '@/components/views/list'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient": FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#BoldFeatureClient": BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#OrderedListFeatureClient": OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#UnorderedListFeatureClient": UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@/components/graph/fields/graph/activities/io/activity-i-o-field#ActivityIOField": ActivityIOField_caf9a311801e7db98fb5e995e8a2596d,
  "@/components/graph/fields/graph/activities/task/activity-task-field#ActivityTaskField": ActivityTaskField_6665d552f7f6a0ad37f39384c6c9f950,
  "@/payload/collections/Activities/components/before-list-table-wrapper#BeforeListTableWrapper": BeforeListTableWrapper_74592d2078933a5095f41d31c1f58f8d,
  "@/payload/components/health/document-health-button#DocumentHealthButton": DocumentHealthButton_8076ad28c6e6c7ac777a780312e306b0,
  "@/plugins/deeplTranslate/client/components/buttons/simple-custom-button#SimpleCustomButton": SimpleCustomButton_60d2bab7b2aa60d4c6b0bb74d5c9870f,
  "@/payload/components/document-usage/document-usage-field#DocumentUsageField": DocumentUsageField_d8674a9ebef88de20dbcc7c240989f48,
  "@/components/graph/fields/graph/flows/io/process-input-output-field#ProcessInputOutputField": ProcessInputOutputField_7dfabc5f295cb2097425696bedb6f5db,
  "@/components/graph/fields/graph/flows/task/process-task-field#ProcessTaskField": ProcessTaskField_322b2d058edf905cfc0862e78bfae81e,
  "@/components/graph/fields/graph/flows/test/process-test-field#ProcessTestField": ProcessTestField_1b1fa1413e304a6d3a95c1ca84726387,
  "@/components/graph/fields/graph/flows/parallel/process-task-parallel-field#ProcessTaskParallelField": ProcessTaskParallelField_ce11f6fca5c05bd2d5b0507aec04ab55,
  "@/payload/collections/TaskFlow/components/clone-task-flows-button#CloneTaskFlowsButton": CloneTaskFlowsButton_3140b54a675ed487f54a48d38a32bb67,
  "@/payload/collections/TaskList/components/clone-task-lists-button#CloneTaskListsButton": CloneTaskListsButton_812b2d715941e8897faa8c83c55fa333,
  "@/components/icon#Icon": Icon_f8022cf35b3d492829ec1a405bd134e9,
  "@/components/logo#Logo": Logo_7a89b5675912f3f4f82dd41bbb03d52e,
  "@/components/activity-landscape-link#ActivityLandscapeLink": ActivityLandscapeLink_1f583f1712000b1eebb17dfdc7ea52f5,
  "@/components/organisation-select#OrganisationSelect": OrganisationSelect_821016dd90dbfccf78f9ba146644dd1e,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@/components/views/activity/overview#ActivitiesView": ActivitiesView_027ca867d2163c8ffc7d59a1792ce0a7,
  "@/components/views/activity/view#ActivityBlockView": ActivityBlockView_f343c9fa1808ff4f8c080c4cae00aecb,
  "@/components/views/flow#FlowBlockView": FlowBlockView_e835b55e87103a9e238abc92e73cdb06,
  "@/components/views/list#ListBlockView": ListBlockView_30dbbeee43bcb0357f44c70df4f960f4,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
