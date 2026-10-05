export interface TextNode { kind: 'text'; text: string }
export interface ElementNode { kind: 'element'; tag: string; attrs: Record<string, string>; children: RichNode[] }
export type RichNode = TextNode | ElementNode
export interface ReferenceSite {
  source: string; captured_at: string; name: string; institution: string
  profile: ElementNode
  navigation: { label: string; path: string }[]
  pages: Record<string, ElementNode>
  documents: Record<'cv' | 'resume', ElementNode>
}
