import { Button, Input, Tabs, Slider } from "@heroui/react";
import { open } from "@tauri-apps/plugin-dialog";

interface GlobalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  toggleTheme: () => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  lineHeight: number;
  setLineHeight: (v: number) => void;
  autoSaveInterval: number;
  setAutoSaveInterval: (v: number) => void;
  defaultFolder: string;
  setDefaultFolder: (v: string) => void;
}

export function GlobalSettings({
  isOpen,
  onClose,
  theme,
  toggleTheme,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  autoSaveInterval,
  setAutoSaveInterval,
  defaultFolder,
  setDefaultFolder,
}: GlobalSettingsProps) {
  const handleFontSizeChange = (value: number | number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setFontSize(nextValue);
  };

  const handleLineHeightChange = (value: number | number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setLineHeight(nextValue);
  };

  const handleAutoSaveIntervalChange = (value: number | number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setAutoSaveInterval(nextValue);
  };

  const handleSelectDefaultFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择默认存储文件夹",
      });
      if (selected && typeof selected === "string") {
        setDefaultFolder(selected);
        localStorage.setItem("defaultFolder", selected);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-100 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-101 w-[720px] h-[520px]">
        <div
          className="glass-card w-full h-full flex flex-col"
          style={{ boxShadow: "0 24px 48px rgba(74, 69, 60, 0.2)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="font-serif font-semibold text-lg text-(--novel-text-main)">
              系统设置
            </h3>
            <Button
              isIconOnly
              variant="ghost"
              onPress={onClose}
              className="text-(--novel-text-muted)"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </Button>
          </div>

          {/* HeroUI Tabs - Vertical Layout */}
          <Tabs
            className="w-full flex-1 min-h-0"
            orientation="vertical"
            variant="secondary"
            defaultSelectedKey="appearance"
          >
            <Tabs.List aria-label="设置导航" className="w-32 py-2">
              <Tabs.Tab id="appearance">外观</Tabs.Tab>
              <Tabs.Tab id="editor">编辑器</Tabs.Tab>
              <Tabs.Tab id="storage">存储</Tabs.Tab>
              <Tabs.Tab id="about">关于</Tabs.Tab>
            </Tabs.List>

            {/* Appearance Panel */}
            <Tabs.Panel id="appearance" className="px-6 py-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-(--accent)/10 flex items-center justify-center">
                      {theme === "dark" ? (
                        <svg
                          className="w-5 h-5 text-(--accent)"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-(--accent)"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-(--novel-text-main)">
                        主题模式
                      </p>
                      <p className="text-xs text-(--novel-text-muted)">
                        {theme === "dark" ? "深色模式" : "浅色模式"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onPress={toggleTheme}
                    className="bg-(--accent)/10 text-(--accent) rounded-lg text-sm"
                  >
                    {theme === "light" ? "🌙 深色" : "☀️ 浅色"}
                  </Button>
                </div>

                {/* Theme Preview Info */}
                <div className="flex items-center gap-2 text-sm text-(--novel-text-muted)">
                  <div className="w-2 h-2 rounded-full bg-(--accent)"></div>
                  <span>主题设置会自动保存并立即生效</span>
                </div>
              </div>
            </Tabs.Panel>

            {/* Editor Panel */}
            <Tabs.Panel id="editor" className="px-6 py-4 overflow-y-auto">
              <div className="space-y-8">
                {/* Font Size */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-(--novel-text-main)">
                        字体大小
                      </p>
                      <p className="text-xs text-(--novel-text-muted)">
                        编辑器正文字号
                      </p>
                    </div>
                    <span className="text-base font-semibold text-(--accent)">
                      {fontSize}px
                    </span>
                  </div>
                  <Slider
                    aria-label="字体大小"
                    step={1}
                    maxValue={24}
                    minValue={12}
                    value={fontSize}
                    onChange={handleFontSizeChange}
                    className="max-w-full"
                  >
                    <Slider.Track>
                      <Slider.Fill />
                      <Slider.Thumb />
                    </Slider.Track>
                  </Slider>
                  <div className="flex justify-between mt-2 text-xs text-(--novel-text-muted)">
                    <span>12px</span>
                    <span>24px</span>
                  </div>
                </div>

                {/* Line Height */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-(--novel-text-main)">
                        行高
                      </p>
                      <p className="text-xs text-(--novel-text-muted)">
                        编辑器行间距
                      </p>
                    </div>
                    <span className="text-base font-semibold text-(--accent)">
                      {lineHeight}
                    </span>
                  </div>
                  <Slider
                    aria-label="行高"
                    step={0.1}
                    maxValue={2.5}
                    minValue={1.2}
                    value={lineHeight}
                    onChange={handleLineHeightChange}
                    className="max-w-full"
                  >
                    <Slider.Track>
                      <Slider.Fill />
                      <Slider.Thumb />
                    </Slider.Track>
                  </Slider>
                  <div className="flex justify-between mt-2 text-xs text-(--novel-text-muted)">
                    <span>1.2</span>
                    <span>2.5</span>
                  </div>
                </div>

                {/* Auto Save Interval */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-(--novel-text-main)">
                        自动保存间隔
                      </p>
                      <p className="text-xs text-(--novel-text-muted)">
                        自动保存编辑内容的时间间隔
                      </p>
                    </div>
                    <span className="text-base font-semibold text-(--accent)">
                      {autoSaveInterval}秒
                    </span>
                  </div>
                  <Slider
                    aria-label="自动保存间隔"
                    step={1}
                    maxValue={30}
                    minValue={5}
                    value={autoSaveInterval}
                    onChange={handleAutoSaveIntervalChange}
                    className="max-w-full"
                  >
                    <Slider.Track>
                      <Slider.Fill />
                      <Slider.Thumb />
                    </Slider.Track>
                  </Slider>
                  <div className="flex justify-between mt-2 text-xs text-(--novel-text-muted)">
                    <span>5秒</span>
                    <span>30秒</span>
                  </div>
                </div>
              </div>
            </Tabs.Panel>

            {/* Storage Panel */}
            <Tabs.Panel id="storage" className="px-6 py-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Default Folder */}
                <div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-(--novel-text-main)">
                      默认存储文件夹
                    </p>
                    <p className="text-xs text-(--novel-text-muted)">
                      新建作品时的默认保存位置
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={defaultFolder || "未设置"}
                      placeholder="点击右侧按钮选择文件夹"
                    />
                    <Button
                      variant="secondary"
                      onPress={handleSelectDefaultFolder}
                      className="bg-(--accent)/10 text-(--accent) rounded-lg min-w-[80px]"
                    >
                      选择
                    </Button>
                  </div>
                </div>

                {/* Storage Info */}
                <div className="flex items-start gap-3 text-sm text-(--novel-text-muted)">
                  <svg
                    className="w-5 h-5 shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                  </svg>
                  <span>
                    所有作品数据以 Markdown
                    格式存储在本地文件夹中，您随时可以通过文件管理器访问。
                  </span>
                </div>
              </div>
            </Tabs.Panel>

            {/* About Panel */}
            <Tabs.Panel id="about" className="px-6 py-4 overflow-y-auto">
              <div className="space-y-6">
                {/* App Info */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-(--accent) flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 12.08L3.95 12 12 8.5 20.05 12 12 15.08zM5 13.5l7 3.82 7-3.82V17l-7 4-7-4v-3.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-(--novel-text-main)">
                      Aphelios
                    </h4>
                    <p className="text-sm text-(--novel-text-muted)">
                      远日点 · 小说编辑器
                    </p>
                    <p className="text-xs text-(--novel-text-accent)">版本 β</p>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="text-sm font-medium text-(--novel-text-main) mb-3">
                    功能特性
                  </p>
                  <ul className="text-sm text-(--novel-text-muted) space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--accent)"></span>
                      本地 Markdown 文件管理
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--accent)"></span>
                      Milkdown 富文本编辑器
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--accent)"></span>
                      深色/浅色主题切换
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--accent)"></span>
                      自动保存功能
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--accent)"></span>
                      导出为 Markdown/TXT
                    </li>
                  </ul>
                </div>

                {/* credits */}
                <p className="text-xs text-center text-(--novel-text-muted)">
                  基于 Tauri + Milkdown 构建
                  <br />© 2026 Aphelios. All rights reserved.
                </p>
              </div>
            </Tabs.Panel>
          </Tabs>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end">
            <Button
              onPress={onClose}
              className="bg-(--accent) text-white rounded-lg px-6"
            >
              完成
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
