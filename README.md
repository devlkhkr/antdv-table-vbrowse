## 🔎 antdv-table-vbrowse

Vue3 Ant-design Table Component Virtual browsing Library

antdv 테이블 내의 데이터를 검색하여 빠른 탐색과 이동을 도와주는 라이브러리 입니다.  
This library helps with fast navigation and movement by searching data within an Ant Design Vue table.  
这是一个通过搜索 Ant Design Vue 表格中的数据来帮助快速导航和移动的库。

---

### 📚 Links

📌 NPM: https://www.npmjs.com/package/antdv-table-vbrowse  
📌 Github: https://github.com/devlkhkr/antdv-table-vbrowse.git

📌 CodeSandbox(DEMO):

---

### 📚 Install
설치 | install | 安装
```
npm i antdv-table-vbrowse
yarn add antdv-table-vbrowse
pnpm i antdv-table-vbrowse
```
- 전역 지시문을 구성하고 등록합니다 (일반적으로 directives.ts)  
  Configure and register global directives (Usually directives.ts)  
  配置并注册全局指令（通常是directives.ts）  
```
import type { App } from 'vue';
import { setupVsearchDirective } from 'antdv-table-vbrowse';

export function setupGlobDirectives(app: App) {
  setupVsearchDirective(app);
}  
```
  
### 📚 Usage
기본 사용 | default usage | 默认用法
```
<Table v-antdv-table-vbrowse /> // Table or a-table
```

옵션 사용 | Usage with options | 带选项的用法
```
<script lang="ts" setup>
	import { Table } from 'ant-design-vue';
	import { ref } from 'vue';
	const refPageSize = ref<number>(20);
	const pagination = ref({
		pageSize: refPageSize,
	});
</script>
// Table or a-table
<Table
	v-antdv-table-vbrowse="{		
		active: true,
		defaultOpen: false,
		placeholder: 'Please Insert Keyword',
		noResultText: 'No Result Defined',
		searchAreaBgColor: '#333',
		searchAreaFontColor: '#fff',
		searchedCellBgColor: '#ffff0035',
		targetCellBgColor: '#ff000045',
		position: 'left bottom',
		movable: true,
		zIndex: 999,
		smoothScroll: true,
		loop: false,

		pagination: pagination,
		// In ant-design-vue Table case, pagination props is required
		// In vben-admin BasicTable case, pagination props is not required
	}"
>
```

- vben admin의 BasicTable 컴포넌트에서 사용시, BasicTable 내 Table 컴포넌트에 적용 가능. (이 경우 pagination은 필수가 아닙니다)  
  Can be applied to the Table component within the BasicTable component of vben admin. In this case, pagination is not required.  
  可应用于vben admin的BasicTable组件内的Table组件。在这种情况下，pagination不是必须的。  

### 📚 API

모든 속성은 optional 하며, 미입력시 default로 설정됩니다.  
All properties are optional and will be set to default values if not provided.  
所有属性都是可选的，如果未提供，则将设置为默认值。


| Property            | Description(KR)                                                   | Description(EN)                                                                                                                                                     | Description(CN)                                            | Type                                                                                | Default                |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------- |
| active              | 활성화 여부                                                            | Activation Status                                                                                                                                                   | 激活状态                                                       | boolean                                                                             | true                   |
| defaultOpen         | 초기 생성시 검색영역 펼쳐짐 여부                                                | Whether the search area is expanded initially                                                                                                                       | 初始时是否展开搜索区域                                                | boolean                                                                             | false                  |
| placeholder         | 검색 input의 placeholder                                             | Placeholder for the search input                                                                                                                                    | 搜索输入的占位符                                                   | string                                                                              | Please Insert Keyword  |
| noResultText        | 검색결과가 없을때의 알림 문구                                                  | Notification text when no search results are found                                                                                                                  | 未找到搜索结果时的通知文本                                              | string                                                                              | No Result Defined      |
| searchAreaBgColor   | 검색영역의 배경 색상                                                       | Background color of the search area                                                                                                                                 | 搜索区域的背景颜色                                                  | string                                                                              | #333 (dark grey)       |
| searchAreaFontColor | 검색영역의 폰트 색상                                                       | Font color of the search area                                                                                                                                       | 搜索区域的字体颜色                                                  | string                                                                              | #FFF (white)           |
| searchedCellBgColor | 검색된 셀의 배경 색상                                                      | Background color of the searched cell                                                                                                                               | 搜索到的单元格背景颜色                                                | string                                                                              | #ffff0035 (yellow 35%) |
| targetCellBgColor   | 타겟 인덱스에 해당하는 배경 색상                                                | Background color for the target index cell                                                                                                                          | 目标索引的背景颜色                                                  | string                                                                              | #ff000045 (red 45%)    |
| position            | 초기 생성 위치                                                          | Initial creation position                                                                                                                                           | 初始创建位置                                                     | left bottom \| left top \| center bottom \| center top \| right bottom \| right top | left bottom            |
| movable             | 검색영역 이동 가능 여부                                                     | Whether the search area is movable                                                                                                                                  | 搜索区域是否可移动                                                  | boolean                                                                             | true                   |
| zIndex              | fixed 상태에서의 z-index (movable이 true일 때만 적용)                        | z-index in fixed state (applies only when movable is true)                                                                                                          | 固定状态下的z-index（仅在movable为true时适用）                           | number                                                                              | 999                    |
| smoothScroll        | 다음 셀로 이동시 스크롤을 부드럽게 할 것인지 여부                                      | Whether to enable smooth scrolling when moving to the next cell                                                                                                     | 移动到下一个单元格时是否启用平滑滚动                                         | boolean                                                                             | false                  |
| loop                | - 마지막 검색결과에서 다음버튼 클릭시 처음으로 이동<br><br>- 첫 검색결과에서 이전버튼 클릭시 마지막으로 이동 | - Move to the first when clicking the next button on the last search result <br><br>- Move to the last when clicking the previous button on the first search result | - 在最后一个搜索结果上点击下一按钮时移动到第一个<br><br>- 在第一个搜索结果上点击上一按钮时移动到最后一个 | boolean                                                                             | false                  |

---

### 🔔 Caution

- Table이 가지고 있는 Datasource에서만 탐색을 실행하기 때문에, 서버사이드에서 페이징 처리시 가져오지 않은 데이터에 대해서는 탐색하지 않습니다.  
  Since the search is executed only within the datasource that the Table possesses, it does not search for data that has not been fetched during server-side pagination.  
  由于搜索仅在 Table 拥有的数据源内执行，因此在服务器端分页时不会搜索尚未获取的数据。
