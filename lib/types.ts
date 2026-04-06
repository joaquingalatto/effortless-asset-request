// ============================================================
// Plugin JSON types (real format from Figma plugin v2.0)
// ============================================================

export interface PluginText {
  node_id: string;
  text: string;
  font_name?: string;
  font_size?: number;
}

export interface PluginComponent {
  node_id: string;
  layer_name: string;
  node_type: string;
  parent_path?: string;
  depth: number;
  occurrence_index?: number;
  size: { width: number; height: number };
  component_name: string;
  component_id?: string;
  component_label?: string | null;
  catalog_match: boolean;
  spec_mode: string;
  suggested_component_id?: string | null;
  texts: (string | PluginText)[];
  preview_png_data_url?: string;
}

export interface PluginJSON {
  schema_version: string;
  generated_at: string;
  source_frame_name: string;
  components: PluginComponent[];
}

// ============================================================
// Component Catalog types (string-based, from catalog_seed.json)
// ============================================================

export interface CatalogDeviceSpecs {
  size: string;   // e.g. "Desktop: 1440 x 810"
  padding: string; // e.g. "Top: 65 | Right: 65 | Bottom: 65 | Left: 65"
  padding_reference_image?: string; // path to padding ref image e.g. "/catalog-images/page004_img002.png"
}

export interface CatalogComponent {
  display_name: string;
  demo_url?: string;
  format?: string;
  max_weight?: string;
  editable?: string;
  desktop: CatalogDeviceSpecs;
  mobile: CatalogDeviceSpecs;
}

export interface ComponentCatalog {
  [key: string]: CatalogComponent;
}

// ============================================================
// Internal / Wizard types
// ============================================================

export interface ParsedComponent {
  id: string;
  layerName: string;
  componentName: string;
  componentLabel: string;
  catalogMatch: boolean;
  suggestedCatalogId: string | null;
  size: { width: number; height: number };
  specMode: string;
  previewDataUrl: string;
  copyTexts: string;
}

export interface RequestJSON {
  schemaVersion: string;
  sourceFrameName: string;
  generatedAt: string;
  components: ParsedComponent[];
}

export interface GlobalFields {
  masterKeyVisual: string;
  formatNeeded: {
    image: boolean;
    text: boolean;
  };
  adaptationNeeded: boolean;
  markets: string;
  requesterName: string;
  translationLanguage: string;
  additionalComments: string;
}

export interface AssetMapping {
  id: string;
  componentName: string;
  layerName: string;
  catalogKey: string;
  isUnmapped: boolean;
  previewImage: string;
  copyTexts: string;
  size: { width: number; height: number };
  warnings: string[];
}

export interface WizardState {
  step: number;
  requestJSON: RequestJSON | null;
  globalFields: GlobalFields;
  assetMappings: AssetMapping[];
  parseErrors: string[];
}
