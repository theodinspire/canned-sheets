type ISODateTime = ReturnType<Date['toISOString']>;

export type DatesAsStrings<T> = {
	[K in keyof T]: T[K] extends Date ? ISODateTime
		: T[K] extends object ? DatesAsStrings<T[K]>
			: T[K] extends Array<infer I> ? DatesAsStrings<I>[]
				: T[K];
};

export type ApiDocumentData = {
	sheets: ApiSheetData[];
};

export type PageRectangle = {
	pageIndex: number;
	llx: number;
	lly: number;
	urx: number;
	ury: number;
};

export type SheetObjectInfo = {
	objectIdentifier: number;
	name: string;
	objectType: SheetObjectType;
};

// Comments
export enum CommentType {
	Note = 'note',
	Threaded = 'threaded',
}

type CommentBase = {
	['$type']: CommentType;
	row: number;
	column: number;
	cellName: string;
};

export type NoteCommentData = CommentBase & {
	['$type']: CommentType.Note;
	note: string;
	author: string;
};

export type ApiNoteCommentData = Omit<NoteCommentData, 'cellName'>;

export type ThreadNode = {
	index: number;
	author: string;
	timestamp: Date;
	comment: string;
};

export type ThreadedCommentData = CommentBase & {
	['$type']: CommentType.Threaded;
	comments: ThreadNode[];
};

export type ApiThreadedCommentData = Omit<DatesAsStrings<ThreadedCommentData>, 'cellName'>;

export type CommentData = NoteCommentData | ThreadedCommentData;

export type ApiCommentData = ApiNoteCommentData | ApiThreadedCommentData;

export enum SheetType {
	Worksheet = 'Worksheet',
	Chart = 'Chart',
}

// Header Footer
export enum HeaderFooterType {
	Header = 0,
	Footer = 1,
}

export enum HeaderFooterPage {
	Default = 0,
	First = 1,
	Even = 2,
}

export enum HeaderFooterPosition {
	Left = 0,
	Center = 1,
	Right = 2,
}

export type HeaderFooterLocatable = {
	type: HeaderFooterType;
	page: HeaderFooterPage;
	position: HeaderFooterPosition;
};

export type HeaderFooter = HeaderFooterLocatable & {
	content: string;
};

export type KeyedHeaderFooter = HeaderFooter & {
	key: string;
};

// Sheet
type SheetBase = {
	index: number;
	name: string;
	$type: SheetType;
};

export type ChartSheet = SheetBase & {
	sheetObject: SheetObject;
	headerFooters: HeaderFooter[];
	$type: SheetType.Chart;
};

export type WorksheetSheetBase = SheetBase & {
	$type: SheetType.Worksheet;
	maxRow: number;
	maxColumn: number;
	cssClass: string;
	cssClassDictionary: Record<string, CssProperties>;
};

export type ApiWorksheetSheetData = WorksheetSheetBase & {
	columns: ApiColumnData[];
	rows: ApiRowData[];
	comments: ApiCommentData[];
	sheetObjects: ApiSheetObject[];
	headerFooters: HeaderFooter[];
};

type SheetObjectBase = {
	objectIdentifier: number;
	name: string;
	objectType: SheetObjectType;
	imageBase64String: string;
};

export type ApiSheetData = ChartSheet | ApiWorksheetSheetData;

export type ApiColumnData = {
	index: number;
	width: number;
	cssClass: string;
};

export type ApiRowData = {
	index: number;
	height: number;
	cells: Cell[];
	cssClass: string;
};

export type ApiSheetObject = SheetObjectBase & {
	upperLeftRow: number;
	upperLeftColumn: number;
	lowerRightRow: number;
	lowerRightColumn: number;
	upperDeltaXOffset: number;
	upperDeltaYOffset: number;
	lowerDeltaXOffset: number;
	lowerDeltaYOffset: number;
};

export type WorksheetSheet = WorksheetSheetBase & {
	columns: Column[];
	rows: Row[];
	comments: CommentData[];
	headerFooters: HeaderFooter[];
	sheetObjects: SheetObject[];
	columnOffset: number;
};

export type Sheet = ChartSheet | WorksheetSheet;

export type Column = ApiColumnData & {
	widthOffset: number;
	hidden: boolean;
};

export type Row = ApiRowData & {
	heightOffset: number;
	cells: Cell[];
	hidden: boolean;
};

export type Cell = {
	name: string;
	value: string;
	cssClass: string;
	imageBase64String?: string;
};

export interface CssProperties {
	properties: Record<string, string>;
}

export type SheetObject = SheetObjectBase & {
	top: number;
	left: number;
	height: number;
	width: number;
};

export type CellRange = {
	sheet: number;
	startingCell: string;
	cellRange: string;
};

export type SelectedObject = SheetObject & {
	sheet: number;
};

export type SelectedCell = {
	sheetIndex: number;
	cell: string;
};

export type SheetName = {
	originalSheetName: string;
	updatedSheetName?: string;
};

export type CellCoordinates = {
	row: number;
	col: number;
};

export enum SheetObjectType {
	Shape = 0,
	Chart = 1,
}
