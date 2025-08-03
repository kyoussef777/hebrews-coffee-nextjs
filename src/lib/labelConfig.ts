import { prisma } from '@/lib/db';
import { LabelSettings, LabelElement } from '@/types';

// Default label configuration fallback
export const DEFAULT_LABEL_CONFIG: LabelSettings = {
  id: 'default',
  name: 'Default',
  width: 90.3,
  height: 36,
  elements: [
    {
      id: 'header',
      type: 'header',
      x: 45.15,
      y: 4,
      fontSize: 10,
      fontWeight: 'bold',
      fontStyle: 'normal',
      align: 'center',
    },
    {
      id: 'orderNumber',
      type: 'orderNumber',
      x: 45.15,
      y: 8,
      fontSize: 9,
      fontWeight: 'normal',
      fontStyle: 'normal',
      align: 'center',
    },
    {
      id: 'customerName',
      type: 'customerName',
      x: 45.15,
      y: 14,
      fontSize: 12,
      fontWeight: 'bold',
      fontStyle: 'normal',
      align: 'center',
    },
    {
      id: 'drink',
      type: 'drink',
      x: 45.15,
      y: 18,
      fontSize: 10,
      fontWeight: 'normal',
      fontStyle: 'normal',
      align: 'center',
    },
    {
      id: 'details',
      type: 'details',
      x: 45.15,
      y: 22,
      fontSize: 8,
      fontWeight: 'normal',
      fontStyle: 'normal',
      align: 'center',
      maxWidth: 85,
      maxLines: 2,
    },
    {
      id: 'notes',
      type: 'notes',
      x: 45.15,
      y: 26,
      fontSize: 7,
      fontWeight: 'normal',
      fontStyle: 'italic',
      align: 'center',
      maxWidth: 85,
      maxLines: 2,
    },
    {
      id: 'verse',
      type: 'verse',
      x: 45.15,
      y: 31,
      fontSize: 6,
      fontWeight: 'normal',
      fontStyle: 'italic',
      align: 'center',
      maxWidth: 85,
      maxLines: 3,
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Get the effective label configuration for the app
 * Priority: custom config ID > app default > hardcoded default
 */
export async function getEffectiveLabelConfig(customConfigId?: string | null): Promise<LabelSettings> {
  try {
    // If a custom config ID is provided, try to load it first
    if (customConfigId) {
      const customConfig = await prisma.labelSettings.findUnique({
        where: { id: customConfigId },
      });
      
      if (customConfig) {
        return {
          ...customConfig,
          elements: Array.isArray(customConfig.elements) 
            ? (customConfig.elements as unknown) as LabelElement[] 
            : [],
        };
      }
    }

    // Try to get the app-wide default configuration
    const defaultSetting = await prisma.settings.findUnique({
      where: { settingKey: 'default_label_config_id' },
    });

    if (defaultSetting) {
      const defaultConfig = await prisma.labelSettings.findUnique({
        where: { id: defaultSetting.settingValue },
      });

      if (defaultConfig) {
        return {
          ...defaultConfig,
          elements: Array.isArray(defaultConfig.elements) 
            ? (defaultConfig.elements as unknown) as LabelElement[] 
            : [],
        };
      }
    }

    // Fallback to hardcoded default
    return DEFAULT_LABEL_CONFIG;
  } catch (error) {
    console.error('Error loading label configuration:', error);
    return DEFAULT_LABEL_CONFIG;
  }
}

/**
 * Get the app-wide default label configuration (without custom override)
 */
export async function getAppDefaultLabelConfig(): Promise<LabelSettings | null> {
  try {
    const defaultSetting = await prisma.settings.findUnique({
      where: { settingKey: 'default_label_config_id' },
    });

    if (!defaultSetting) {
      return null;
    }

    const defaultConfig = await prisma.labelSettings.findUnique({
      where: { id: defaultSetting.settingValue },
    });

    if (!defaultConfig) {
      return null;
    }

    return {
      ...defaultConfig,
      elements: Array.isArray(defaultConfig.elements) 
        ? (defaultConfig.elements as unknown) as LabelElement[] 
        : [],
    };
  } catch (error) {
    console.error('Error loading app default label configuration:', error);
    return null;
  }
}