<!-- src/pages/FormsPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="مدیریت کاربرگ‌ها" subtitle="تعریف و مدیریت فرم‌های پویا" icon="description">
      <q-btn unelevated color="primary" icon="add" label="کاربرگ جدید" @click="openDialog()" />
    </PageHeader>

    <div class="filter-bar">
      <div class="filter-left">
        <q-input
          v-model="search"
          outlined
          dense
          placeholder="جستجو در کد کاربرگ..."
          clearable
          style="max-width:320px"
          @update:model-value="handleSearch"
        >
          <template #prepend><q-icon name="search" size="18px" color="grey-5" /></template>
        </q-input>

      </div>
      <span class="stat-chip">{{ pagination.total }} کاربرگ</span>
      <!-- دکمه آپلود -->
      <q-btn
        unelevated
        color="primary"
        icon="cloud_upload"
        label="بارگذاری از اکسل"
        @click="openUploadDialog"
      />
    </div>

    <SortableTable :columns="columns" :rows="rows" empty-icon="description" empty-text="کاربرگی یافت نشد" default-sort="code" :loading="loading">
      <template #default="{ row, index }">
        <td class="text-center">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
        <td><code class="code-chip">{{ row.code }}</code></td>
        <td>{{ row.unit?.name || '—' }}</td>
        <td>{{ row.target?.title || '—' }}</td>
        <td>{{ row.program?.title || '—' }}</td>
        <td>{{ row.task?.title || '—' }}</td>
        <td>{{ row.activity?.title || '—' }}</td>
        <td>
    <span class="status-badge" :class="row.is_completed ? 'badge-active' : 'badge-pending'">
      {{ row.is_completed ? 'تکمیل شده' : 'در انتظار تکمیل' }}
    </span>
        </td>
        <td>
          <div class="action-btns">
            <button class="act-btn act-download" @click="downloadForm(row)" title="دانلود اکسل">
              <q-icon name="download" size="16px" />
            </button>
            <button class="act-btn act-view" @click="openForm(row)" title="مشاهده فرم">
              <q-icon name="visibility" size="16px" />
            </button>
            <button class="act-btn act-assign" @click="openFields(row)" title="مدیریت فیلدها">
              <q-icon name="tune" size="16px" />
            </button>
            <button class="act-btn act-edit" @click="openDialog(row)" title="ویرایش">
              <q-icon name="edit" size="16px" />
            </button>
            <button class="act-btn act-delete" @click="deleteRow(row)" title="حذف">
              <q-icon name="delete_outline" size="16px" />
            </button>
          </div>
        </td>
      </template>
    </SortableTable>

    <!-- Pagination -->
    <div class="pagination-wrapper" v-if="pagination.last_page > 1">
      <q-pagination
        v-model="pagination.current_page"
        :max="pagination.last_page"
        :max-pages="5"
        direction-links
        boundary-links
        @update:model-value="goToPage"
      />
      <span class="pagination-info">
        نمایش {{ ((pagination.current_page - 1) * pagination.per_page) + 1 }} تا
        {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} از
        {{ pagination.total }} کاربرگ
      </span>
    </div>

    <!-- دیالوگ ایجاد/ویرایش -->
    <q-dialog v-model="dialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editing ? 'ویرایش کاربرگ' : 'کاربرگ جدید' }}</h3>
          <button class="dialog-close" @click="dialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">

          <!-- فیلد کد کاربرگ -->
          <div class="form-group full-width">
            <label>کد کاربرگ <span class="req">*</span></label>
            <q-input v-model="form.code" outlined dense hide-bottom-space />
          </div>

          <!-- فیلد واحد مرتبط (همیشه فعال - لیست همه واحدها) -->
          <div class="form-group full-width">
            <label>واحد مرتبط <span class="req">*</span></label>
            <q-select
              v-model="form.unit_id"
              outlined
              dense
              :options="unitOpts"
              emit-value
              map-options
            />
          </div>

          <!-- فیلد هدف مرتبط (همیشه فعال - لیست همه اهداف) -->
          <div class="form-group full-width">
            <label>هدف مرتبط <span class="req">*</span></label>
            <q-select
              v-model="form.target_id"
              outlined
              dense
              :options="targetOpts"
              emit-value
              map-options
              @update:model-value="onTargetChange"
            />
          </div>

          <!-- فیلد برنامه مرتبط (وابسته به هدف) -->
          <div class="form-group full-width">
            <label>برنامه مرتبط <span class="req">*</span></label>
            <q-select
              v-model="form.program_id"
              outlined
              dense
              :options="filteredProgramOpts"
              emit-value
              map-options
              :disable="!form.target_id"
              @update:model-value="onProgramChange"
            />
            <div v-if="form.target_id && filteredProgramOpts.length === 0 && !form.program_id" class="field-hint">
              برای این هدف برنامه‌ای تعریف نشده است
            </div>
          </div>

          <!-- فیلد اقدام مرتبط (وابسته به برنامه - اختیاری) -->
          <div class="form-group full-width">
            <label>اقدام مرتبط (اختیاری)</label>
            <q-select
              v-model="form.task_id"
              outlined
              dense
              :options="filteredTaskOpts"
              emit-value
              map-options
              :disable="!form.program_id"
              @update:model-value="onTaskChange"
            />
            <div v-if="form.program_id && filteredTaskOpts.length === 0 && !form.task_id" class="field-hint">
              برای این برنامه اقدامی تعریف نشده است
            </div>
          </div>

          <!-- فیلد فعالیت مرتبط (وابسته به اقدام - اختیاری) -->
          <div class="form-group full-width">
            <label>فعالیت مرتبط (اختیاری)</label>
            <q-select
              v-model="form.activity_id"
              outlined
              dense
              :options="filteredActivityOpts"
              emit-value
              map-options
              :disable="!form.task_id"
            />
            <div v-if="form.task_id && filteredActivityOpts.length === 0 && !form.activity_id" class="field-hint">
              برای این اقدام فعالیتی تعریف نشده است
            </div>
          </div>

          <!-- فیلد توضیحات -->
          <div class="form-group full-width">
            <label>توضیحات</label>
            <q-input v-model="form.description" outlined dense type="textarea" rows="3" />
          </div>

        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="dialog=false" />
          <q-btn unelevated color="primary" :label="editing ? 'ذخیره' : 'ایجاد'" @click="save" :loading="saving" />
        </div>
      </div>
    </q-dialog>
    <!-- دیالوگ آپلود فایل -->
    <q-dialog v-model="uploadDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>بارگذاری کاربرگ از فایل اکسل</h3>
          <button class="dialog-close" @click="uploadDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-group full-width">
            <label>فایل اکسل <span class="req">*</span></label>
            <q-file
              v-model="uploadForm.file"
              outlined
              dense
              accept=".xlsx, .xls"
              label="انتخاب فایل"
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            <div class="field-hint">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              هر شیت در فایل به عنوان یک کاربرگ جداگانه ایجاد می‌شود. نام هر شیت به عنوان کد کاربرگ استفاده می‌شود.
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="uploadDialog=false" />
          <q-btn unelevated color="primary" label="بارگذاری" @click="uploadFormSubmit" :loading="uploading" />
        </div>
      </div>
    </q-dialog>
    <!-- دیالوگ مشاهده فرم -->
    <q-dialog v-model="formDialog" persistent>
      <div class="form-dialog-xl">
        <div class="dialog-head">
          <h3>فرم کاربرگ: {{ selectedForm?.code }}</h3>
          <button class="dialog-close" @click="formDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <!-- اطلاعات متادیتا -->
          <div class="form-meta-bar">
            <span><q-icon name="business" size="14px" class="q-ml-xs" />{{ selectedForm?.unit?.name || '—' }}</span>
            <span><q-icon name="track_changes" size="14px" class="q-ml-xs" />{{ selectedForm?.target?.title || '—' }}</span>
            <span><q-icon name="event_note" size="14px" class="q-ml-xs" />{{ selectedForm?.program?.title || '—' }}</span>
            <span v-if="selectedForm?.task"><q-icon name="checklist_rtl" size="14px" class="q-ml-xs" />{{ selectedForm?.task?.title }}</span>
            <span v-if="selectedForm?.activity"><q-icon name="article" size="14px" class="q-ml-xs" />{{ selectedForm?.activity?.title }}</span>
          </div>

          <!-- فیلدهای فرم به صورت جدول -->
          <div class="dynamic-form">
            <div v-if="dynamicFields.length > 0" class="form-table-container">
              <!-- دکمه افزودن ردیف -->
              <div class="table-toolbar">
                <span class="row-count">{{ dataRows.length }} ردیف داده</span>
                <q-btn 
                  unelevated 
                  color="primary" 
                  icon="add" 
                  label="افزودن ردیف" 
                  size="sm" 
                  @click="addDataRow" 
                />
              </div>

              <!-- جدول داده‌ها -->
              <div class="form-table-wrapper">
                <table class="form-data-table">
                  <thead>
                    <tr>
                      <th style="width: 60px;">#</th>
                      <th v-for="field in dynamicFields" :key="field.id">
                        {{ field.field_label }}
                        <span v-if="field.is_required" class="req">*</span>
                      </th>
                      <th style="width: 80px;">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIndex) in dataRows" :key="rowIndex">
                      <td class="text-center">{{ rowIndex + 1 }}</td>
                      <td v-for="field in dynamicFields" :key="field.id">
                        <!-- فیلد متنی -->
                        <q-input
                          v-if="['text','number','date'].includes(field.field_type)"
                          v-model="row.values[field.id]"
                          outlined
                          dense
                          :type="field.field_type"
                          :placeholder="field.field_placeholder"
                          class="table-input"
                        />

                        <!-- فیلد انتخاب -->
                        <q-select
                          v-else-if="field.field_type === 'select'"
                          v-model="row.values[field.id]"
                          outlined
                          dense
                          :options="field.field_options || []"
                          :placeholder="field.field_placeholder"
                          class="table-input"
                        />

                        <!-- فیلد متن چندخطی -->
                        <q-input
                          v-else-if="field.field_type === 'textarea'"
                          v-model="row.values[field.id]"
                          outlined
                          dense
                          type="textarea"
                          rows="2"
                          :placeholder="field.field_placeholder"
                          class="table-input"
                        />

                        <!-- فیلد چک‌باکس -->
                        <q-toggle
                          v-else-if="field.field_type === 'checkbox'"
                          v-model="row.values[field.id]"
                          color="primary"
                          class="table-input"
                        />
                      </td>
                      <td class="text-center">
                        <q-btn
                          flat
                          dense
                          round
                          icon="delete"
                          color="negative"
                          size="sm"
                          @click="removeDataRow(rowIndex)"
                          title="حذف ردیف"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- پیام در صورت نبود فیلد -->
            <div v-else class="no-fields-message">
              <q-icon name="info" size="24px" color="grey-5" />
              <p>این کاربرگ هنوز فیلدی ندارد. از بخش "مدیریت فیلدها" می‌توانید فیلد اضافه کنید.</p>
            </div>

            <!-- فیلد تکمیل شده -->
            <div class="dyn-field dyn-field--completed" style="margin-top: 20px;">
              <label class="dyn-label">وضعیت تکمیل</label>
              <q-toggle
                v-model="formIsCompleted"
                :label="formIsCompleted ? 'تکمیل شده' : 'در انتظار تکمیل'"
                color="primary"
              />
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="بستن" @click="formDialog=false" />
          <q-btn unelevated color="primary" label="ذخیره فرم" @click="saveForm" :loading="savingForm" />
        </div>
      </div>
    </q-dialog>

    <!-- دیالوگ مدیریت فیلدها -->
    <q-dialog v-model="fieldsDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>فیلدهای فرم: {{ selectedForm?.code }}</h3>
          <button class="dialog-close" @click="fieldsDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="fields-toolbar">
            <span class="fields-count">{{ editableFields.length }} فیلد تعریف شده</span>
            <q-btn unelevated color="primary" icon="add" label="افزودن فیلد" size="sm" @click="addField" />
          </div>

          <div class="fields-list">
            <div v-for="(f, idx) in editableFields" :key="idx" class="field-editor">
              <div class="field-editor-num">{{ idx + 1 }}</div>
              <div class="field-editor-body">
                <div class="form-row">
                  <div class="form-group">
                    <label>عنوان فیلد</label>
                    <q-input v-model="f.field_label" outlined dense placeholder="مثال: نام پروژه" />
                  </div>
                  <div class="form-group">
                    <label>نوع فیلد</label>
                    <q-select v-model="f.field_type" outlined dense :options="fieldTypes" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>متن راهنما</label>
                    <q-input v-model="f.field_placeholder" outlined dense />
                  </div>
                  <div class="form-group" style="justify-content:space-around; padding-top:22px">
                    <div class="flex items-center gap-12" style="justify-content: space-between">
                      <q-checkbox v-model="f.is_required" label="الزامی " dense color="primary" />
                      <button class="act-btn act-delete" @click="editableFields.splice(idx,1)">
                        <q-icon name="delete_outline" size="16px" />
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="f.field_type === 'select'" class="form-group">
                  <label>گزینه‌ها (با کاما جدا کنید)</label>
                  <q-input v-model="f.optionsText" outlined dense placeholder="گزینه ۱, گزینه ۲, گزینه ۳" />
                </div>
              </div>
            </div>

            <div v-if="!editableFields.length" class="empty-fields">
              <q-icon name="add_circle_outline" size="36px" color="grey-4" />
              <p>هنوز فیلدی تعریف نشده است</p>
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="fieldsDialog=false" />
          <q-btn unelevated color="primary" label="ذخیره فیلدها" @click="saveFields" :loading="savingFields" />
        </div>
      </div>
    </q-dialog>

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'components/PageHeader.vue'
import SortableTable from 'components/SortableTable.vue'

export default {
  components: { PageHeader, SortableTable },
  setup () {
    const $q = useQuasar()
    const search = ref('')
    const dialog = ref(false)
    const formDialog = ref(false)
    const fieldsDialog = ref(false)
    const editing = ref(null)
    const selectedForm = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const savingForm = ref(false)
    const savingFields = ref(false)
    const rows = ref([])

    const unitOpts = ref([])
    const targetOpts = ref([])
    const allPrograms = ref([])
    const allTasks = ref([])
    const allActivities = ref([])

    const dynamicFields = ref([])
    const dataRows = ref([]) // ذخیره چند ردیف داده
    const formIsCompleted = ref(false)
    const editableFields = ref([])
    const uploadDialog = ref(false)
    const uploading = ref(false)
    const uploadForm = ref({ code: '', file: null })

    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    })

    const fieldTypes = ['text', 'number', 'date', 'select', 'textarea', 'checkbox']

    const filteredProgramOpts = computed(() => {
      if (form.value.target_id) {
        return allPrograms.value
          .filter(p => p.target_id === form.value.target_id)
          .map(p => ({ label: `${p.code}: ${p.title}`, value: p.id }))
      }
      return []
    })

    const filteredTaskOpts = computed(() => {
      if (form.value.program_id) {
        return allTasks.value
          .filter(t => t.program_id === form.value.program_id)
          .map(t => ({ label: `${t.code}: ${t.title}`, value: t.id }))
      }
      return []
    })

    const filteredActivityOpts = computed(() => {
      if (form.value.task_id) {
        return allActivities.value
          .filter(a => a.task_id === form.value.task_id)
          .map(a => ({ label: a.title, value: a.id }))
      }
      return []
    })

    const columns = [
      { key: 'index', label: '#', sortable: false },
      { key: 'code', label: 'کد کاربرگ', sortable: true },
      { key: 'unit', label: 'واحد', sortable: true },
      { key: 'target', label: 'هدف', sortable: true },
      { key: 'program', label: 'برنامه', sortable: true },
      { key: 'task', label: 'اقدام', sortable: true },
      { key: 'activity', label: 'فعالیت', sortable: true },
      { key: 'is_completed', label: 'وضعیت تکمیل', sortable: true }, // اضافه شده
      { key: 'actions', label: 'عملیات', sortable: false },
    ]

    const emptyForm = () => ({
      code: '',
      unit_id: null,
      target_id: null,
      program_id: null,
      task_id: null,
      activity_id: null,
      description: ''
    })
    const form = ref(emptyForm())

    const fetchUnits = async () => {
      try {
        const response = await api.get('/units?per_page=100')
        if (response.data.success) {
          unitOpts.value = response.data.data.map(unit => ({
            label: unit.name,
            value: unit.id
          }))
        }
      } catch (error) {
        console.error('Fetch units error:', error)
      }
    }

    const fetchTargets = async () => {
      try {
        const response = await api.get('/targets?per_page=100')
        if (response.data.success) {
          targetOpts.value = response.data.data.map(target => ({
            label: `${target.code}: ${target.title}`,
            value: target.id
          }))
        }
      } catch (error) {
        console.error('Fetch targets error:', error)
      }
    }

    const fetchPrograms = async () => {
      try {
        const response = await api.get('/programs?per_page=100')
        if (response.data.success) {
          allPrograms.value = response.data.data
        }
      } catch (error) {
        console.error('Fetch programs error:', error)
      }
    }

    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks?per_page=100')
        if (response.data.success) {
          allTasks.value = response.data.data
        }
      } catch (error) {
        console.error('Fetch tasks error:', error)
      }
    }

    const fetchActivities = async () => {
      try {
        const response = await api.get('/activities?per_page=100')
        if (response.data.success) {
          allActivities.value = response.data.data
        }
      } catch (error) {
        console.error('Fetch activities error:', error)
      }
    }

    const fetchForms = async () => {
      loading.value = true
      try {
        let url = `/forms?page=${pagination.value.current_page}&per_page=${pagination.value.per_page}`
        if (search.value) {
          url += `&search=${encodeURIComponent(search.value)}`
        }
        const response = await api.get(url)
        if (response.data.success) {
          rows.value = response.data.data
          pagination.value = {
            current_page: response.data.pagination.current_page,
            last_page: response.data.pagination.last_page,
            per_page: response.data.pagination.per_page,
            total: response.data.pagination.total
          }
        }
      } catch (error) {
        console.error('Fetch forms error:', error)
      } finally {
        loading.value = false
      }
    }

    // ============================================================
    // مهم: دریافت فرم کاربرگ برای نمایش و مقداردهی
    // ============================================================
    const fetchFormFields = async (formId) => {
      console.log('Fetching form fields for formId:', formId)
      try {
        const response = await api.get(`/forms/${formId}/form`)
        console.log('API Response:', response.data)

        if (response.data && response.data.success) {
          // ذخیره اطلاعات فرم
          selectedForm.value = response.data.data.form

          // ذخیره فیلدها
          dynamicFields.value = response.data.data.fields || []

          // ذخیره ردیف‌های داده
          dataRows.value = response.data.data.data_rows || []
          
          // اگر هیچ ردیف داده نداشتیم، یک ردیف خالی ایجاد کن
          if (dataRows.value.length === 0) {
            const emptyRow = { row_index: 0, values: {} }
            dynamicFields.value.forEach(field => {
              emptyRow.values[field.id] = ''
            })
            dataRows.value.push(emptyRow)
          }

          // مقداردهی وضعیت تکمیل
          formIsCompleted.value = response.data.data.form?.is_completed || false

          console.log('Dynamic fields count:', dynamicFields.value.length)
          console.log('Data rows count:', dataRows.value.length)
        } else {
          console.error('API error:', response.data?.message)
          dynamicFields.value = []
          dataRows.value = []
        }
      } catch (error) {
        console.error('Fetch form fields error:', error)
        dynamicFields.value = []
        dataRows.value = []
      }
    }

    const fetchFormEditableFields = async (formId) => {
      try {
        const response = await api.get(`/forms/${formId}/fields`)
        if (response.data.success) {
          const fields = response.data.data || []
          editableFields.value = fields.map(f => ({
            id: f.id,
            field_label: f.field_label,
            field_type: f.field_type,
            field_placeholder: f.field_placeholder || '',
            is_required: f.is_required,
            optionsText: f.field_options ? f.field_options.join(', ') : ''
          }))
        }
      } catch (error) {
        console.error('Fetch form editable fields error:', error)
        editableFields.value = []
      }
    }

    const handleSearch = () => {
      pagination.value.current_page = 1
      fetchForms()
    }

    const goToPage = (page) => {
      pagination.value.current_page = page
      fetchForms()
    }

    const onTargetChange = () => {
      form.value.program_id = null
      form.value.task_id = null
      form.value.activity_id = null
    }

    const onProgramChange = () => {
      form.value.task_id = null
      form.value.activity_id = null
    }

    const onTaskChange = () => {
      form.value.activity_id = null
    }

    const openDialog = (row = null) => {
      editing.value = row
      if (row) {
        form.value = {
          code: row.code,
          unit_id: row.unit_id,
          target_id: row.target_id,
          program_id: row.program_id,
          task_id: row.task_id,
          activity_id: row.activity_id,
          description: row.description || ''
        }
      } else {
        form.value = emptyForm()
      }
      dialog.value = true
    }

    const openForm = async (row) => {
      selectedForm.value = row
      await fetchFormFields(row.id)
      formIsCompleted.value = row.is_completed || false
      formDialog.value = true
    }

    const openFields = async (row) => {
      selectedForm.value = row
      await fetchFormEditableFields(row.id)
      fieldsDialog.value = true
    }

    const addField = () => {
      editableFields.value.push({
        field_label: '',
        field_type: 'text',
        field_placeholder: '',
        is_required: false,
        optionsText: ''
      })
    }

    const save = async () => {
      if (!form.value.code || !form.value.unit_id || !form.value.target_id || !form.value.program_id) {
        $q.notify({
          type: 'negative',
          message: 'کد کاربرگ، واحد، هدف و برنامه الزامی هستند',
          position: 'top'
        })
        return
      }

      saving.value = true

      try {
        if (editing.value) {
          const response = await api.put(`/forms/${editing.value.id}`, form.value)
          if (response.data.success) {
            $q.notify({ type: 'positive', message: 'کاربرگ با موفقیت ویرایش شد', position: 'top' })
            await fetchForms()
            dialog.value = false
          }
        } else {
          const response = await api.post('/forms', form.value)
          if (response.data.success) {
            $q.notify({ type: 'positive', message: 'کاربرگ جدید با موفقیت ایجاد شد', position: 'top' })
            await fetchForms()
            dialog.value = false
          }
        }
      } catch (error) {
        console.error('Save form error:', error)
        $q.notify({ type: 'negative', message: error.response?.data?.message || 'خطا در ارتباط با سرور', position: 'top' })
      } finally {
        saving.value = false
      }
    }

    const saveForm = async () => {
      savingForm.value = true

      try {
        // آماده‌سازی data_rows برای ارسال
        const dataRowsToSend = dataRows.value.map(row => ({
          row_index: row.row_index,
          values: row.values
        }))

        const response = await api.post(`/forms/${selectedForm.value.id}/form`, {
          data_rows: dataRowsToSend,
          is_completed: formIsCompleted.value
        })

        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: 'فرم با موفقیت ذخیره شد',
            position: 'top'
          })
          await fetchForms() // به‌روزرسانی لیست کاربرگ‌ها
          formDialog.value = false
        } else {
          $q.notify({
            type: 'negative',
            message: response.data.message || 'خطا در ذخیره فرم',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Save form error:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'خطا در ذخیره فرم',
          position: 'top'
        })
      } finally {
        savingForm.value = false
      }
    }

    // افزودن ردیف جدید
    const addDataRow = () => {
      const newRow = {
        row_index: dataRows.value.length,
        values: {}
      }
      dynamicFields.value.forEach(field => {
        newRow.values[field.id] = ''
      })
      dataRows.value.push(newRow)
    }

    // حذف ردیف
    const removeDataRow = (index) => {
      if (dataRows.value.length > 1) {
        dataRows.value.splice(index, 1)
        // به‌روزرسانی row_index برای ردیف‌های بعدی
        dataRows.value.forEach((row, idx) => {
          row.row_index = idx
        })
      } else {
        $q.notify({
          type: 'warning',
          message: 'حداقل یک ردیف باید وجود داشته باشد',
          position: 'top'
        })
      }
    }


    const saveFields = async () => {
      const hasEmptyLabel = editableFields.value.some(f => !f.field_label || f.field_label.trim() === '')
      if (hasEmptyLabel) {
        $q.notify({
          type: 'negative',
          message: 'عنوان تمام فیلدها باید پر شود',
          position: 'top'
        })
        return
      }

      savingFields.value = true

      try {
        const fieldsData = editableFields.value.map(f => ({
          field_label: f.field_label,
          field_type: f.field_type,
          field_placeholder: f.field_placeholder || '',
          is_required: f.is_required || false,
          optionsText: f.optionsText || ''
        }))

        const response = await api.post(`/forms/${selectedForm.value.id}/fields`, {
          fields: fieldsData
        })

        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: 'فیلدهای فرم با موفقیت ذخیره شد',
            position: 'top'
          })
          fieldsDialog.value = false
          await fetchForms()
        }
      } catch (error) {
        console.error('Save fields error:', error)
        $q.notify({ type: 'negative', message: error.response?.data?.message || 'خطا در ذخیره فیلدها', position: 'top' })
      } finally {
        savingFields.value = false
      }
    }

    const deleteRow = (row) => {
      $q.dialog({
        title: 'حذف کاربرگ',
        message: `آیا از حذف "${row.code}" مطمئنید؟`,
        cancel: { label: 'انصراف', flat: true },
        ok: { label: 'حذف', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        try {
          const response = await api.delete(`/forms/${row.id}`)
          if (response.data.success) {
            $q.notify({ type: 'positive', message: 'کاربرگ با موفقیت حذف شد', position: 'top' })
            await fetchForms()
          }
        } catch (error) {
          console.error('Delete form error:', error)
          $q.notify({ type: 'negative', message: error.response?.data?.message || 'خطا در حذف کاربرگ', position: 'top' })
        }
      })
    }
    const openUploadDialog = () => {
      uploadForm.value = { file: null }
      uploadDialog.value = true
    }

    const uploadFormSubmit = async () => {
      if (!uploadForm.value.file) {
        $q.notify({
          type: 'negative',
          message: 'لطفاً فایل را انتخاب کنید',
          position: 'top'
        })
        return
      }

      uploading.value = true

      try {
        const formData = new FormData()
        formData.append('file', uploadForm.value.file)

        const response = await api.post('/forms/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (response.data.success) {
          // بررسی تعداد کاربرگ‌های ایجاد شده
          const importedCount = response.data.imported_count || 0
          const errorCount = response.data.error_count || 0
          
          let message = response.data.message
          
          // نمایش خطاها (اگر وجود داشته باشد)
          if (errorCount > 0 && response.data.errors) {
            message += '\n\nخطاها:\n' + response.data.errors.join('\n')
          }
          
          $q.notify({
            type: importedCount > 0 ? 'positive' : 'warning',
            message: message,
            position: 'top',
            timeout: errorCount > 0 ? 8000 : 3000,
            multiLine: errorCount > 0,
            html: errorCount > 0
          })
          
          // بستن دیالوگ فقط در صورت موفقیت
          if (importedCount > 0) {
            uploadDialog.value = false
            await fetchForms()
          }
        } else {
          $q.notify({
            type: 'warning',
            message: response.data.message,
            position: 'top',
            timeout: 5000
          })
        }
      } catch (error) {
        console.error('Upload error:', error)
        const message = error.response?.data?.message || 'خطا در بارگذاری فایل'
        const errors = error.response?.data?.errors
        
        let fullMessage = message
        if (errors && Array.isArray(errors)) {
          fullMessage += '\n\nخطاها:\n' + errors.join('\n')
        }
        
        $q.notify({
          type: 'negative',
          message: fullMessage,
          position: 'top',
          timeout: 5000,
          multiLine: !!errors,
          html: !!errors
        })
      } finally {
        uploading.value = false
      }
    }

    const downloadForm = async (row) => {
      try {
        const response = await api.get(`/forms/${row.id}/export`, {
          responseType: 'blob'
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${row.code}.xlsx`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        $q.notify({
          type: 'positive',
          message: 'دانلود فایل با موفقیت انجام شد',
          position: 'top'
        })
      } catch (error) {
        console.error('Download error:', error)
        $q.notify({
          type: 'negative',
          message: 'خطا در دانلود فایل',
          position: 'top'
        })
      }
    }
    onMounted(() => {
      fetchUnits()
      fetchTargets()
      fetchPrograms()
      fetchTasks()
      fetchActivities()
      fetchForms()
    })

    return {
      search,
      dialog,
      formDialog,
      fieldsDialog,
      editing,
      selectedForm,
      loading,
      saving,
      savingForm,
      savingFields,
      rows,
      form,
      unitOpts,
      targetOpts,
      filteredProgramOpts,
      filteredTaskOpts,
      filteredActivityOpts,
      dynamicFields,
      dataRows,
      editableFields,
      fieldTypes,
      columns,
      pagination,
      openDialog,
      openForm,
      openFields,
      addField,
      save,
      saveForm,
      addDataRow,
      removeDataRow,
      saveFields,
      deleteRow,
      goToPage,
      handleSearch,
      onTargetChange,
      onProgramChange,
      formIsCompleted,
      onTaskChange,
      uploadDialog,
      uploading,
      uploadForm,
      openUploadDialog,
      uploadFormSubmit,
      downloadForm,
    }
  }
}
</script>

<style lang="scss" scoped>
@import './page-shared.scss';

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0;
  .pagination-info { font-size: 13px; color: #64748b; }
}

.form-group.full-width {
  grid-column: 1 / -1;
  width: 100%;
}

.field-hint {
  font-size: 11px;
  color: #f59e0b;
  margin-top: 4px;
  padding-right: 8px;
}

.form-meta-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; background: #f8fafc; border-radius: 10px;
  margin-bottom: 20px; font-size: 12.5px; color: #64748b;
  flex-wrap: wrap;
}

.dynamic-form { display: flex; flex-direction: column; gap: 16px; }
.dyn-field { display: flex; flex-direction: column; gap: 6px; }
.dyn-label { font-size: 13px; font-weight: 600; color: #334155; }

.fields-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.fields-count { font-size: 13px; color: #64748b; font-weight: 500; }
.fields-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
.field-editor {
  display: flex; gap: 12px;
  padding: 14px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #f1f5f9;
}
.field-editor-num {
  width: 24px; height: 24px; border-radius: 6px;
  background: #e2e8f0; color: #64748b;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.field-editor-body { flex: 1; }
.empty-fields { text-align: center; padding: 32px; color: #94a3b8; p { margin-top: 8px; font-size: 13px; } }
.gap-12 { gap: 12px; }

.dynamic-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dyn-field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .dyn-label {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
}

.dyn-field--completed {
  margin-top: 8px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #eef2f6;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .dyn-label {
    margin-bottom: 0;
  }
}
.act-btn {
  &.act-download { background: #e0f2fe; color: #0284c7; }
}
</style>


/* استایل‌های جدول چند ردیفی */
.form-table-container {
  margin-top: 20px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.row-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.form-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.form-data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.form-data-table thead th {
  background: #1976d2;
  color: white;
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  border-left: 1px solid rgba(255,255,255,0.1);
}

.form-data-table thead th:last-child {
  border-left: none;
}

.form-data-table tbody td {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  border-left: 1px solid #e0e0e0;
  vertical-align: middle;
}

.form-data-table tbody td:last-child {
  border-left: none;
}

.form-data-table tbody tr:last-child td {
  border-bottom: none;
}

.form-data-table tbody tr:hover {
  background: #f9f9f9;
}

.table-input {
  min-width: 150px;
}

.no-fields-message {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-fields-message p {
  margin-top: 12px;
  font-size: 14px;
}
