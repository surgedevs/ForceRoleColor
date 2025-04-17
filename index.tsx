/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Text } from "@webpack/common";
import { Common } from "webpack";

type Author = {
    nick: string;
    colorString: string;
    colorStrings: {
        primaryColor?: string;
        secondaryColor?: string;
        tertiaryColor?: string;
    };
    colorRoleName: string;
    guildId?: string;
};

const settings = definePluginSettings({
    hint: {
        type: OptionType.COMPONENT,
        component: function () {
            return <Text>
                <b>Colors must be in hex (in the format of #XXXXXX) i.e. #ff0000, #123456, etc.</b><br /><br />
                Primary: Controls base color<br />
                Secondary & Tertiary: Set for gradient
                <br /><b>Switch channels for the color to update</b>
                <div style={{
                    margin: "2em 0",
                    padding: "1em",
                    backgroundColor: "#e7828430",
                    border: "1px solid #e78284",
                    borderRadius: "5px",
                    color: "var(--text-normal, white)"
                }} className="markup__75297">
                    Gradient role colors require the experiment <code className="inline" style={{ whiteSpace: "nowrap" }}>2025-03_enhanced_role_colors</code> to be enabled!
                </div>
            </Text>;
        }
    },
    primaryColor: {
        type: OptionType.STRING,
        description: "",
        default: undefined,
        placeholder: "#000000"
    },
    secondaryColor: {
        type: OptionType.STRING,
        description: "",
        default: undefined,
        placeholder: "#000000"
    },
    tertiaryColor: {
        type: OptionType.STRING,
        description: "",
        default: undefined,
        placeholder: "#000000"
    },
    dmsOnly: {
        type: OptionType.BOOLEAN,
        description: "Applies your color only in DMs",
        default: false,
    }
});

export default definePlugin({
    name: "ForceRoleColor",
    description: "Forces a specific role color on yourself globally",
    authors: [Devs.surgedevs],
    settings,
    patches: [
        {
            find: ".gradientStyle),{textDecorationColor:null==",
            replacement: [
                {
                    match: /(?<=let{author:\i,message:)(\i)(.*?)(?<=colorStrings:\i,colorRoleName:\i}=)(\i)/,
                    replace: "$1$2$self.getAuthor($1,$3)"
                },
                {
                    match: /\(0,\i\.\i\)\(null!=\i\?\i:\i,"BaseUsername"\)/,
                    replace: "true"
                }
            ]
        },
        {
            find: ".name,roleColors:",
            replacement: {
                match: /(?<=let{colorRoleName.*?colorString:(\i).*?roleColorStrings:(\i).*?user:(\i).*?}=\i;)/,
                replace: "let{colorString:_$1,roleColorStrings:_$2}=$self.getColors($3,$1,$2);$1=_$1;$2=_$2;"
            }
        }
    ],

    getAuthor(message: any, old: Author): Author {
        if (
            message.author.id !== Common.UserStore.getCurrentUser().id
            || (settings.store.dmsOnly && old.guildId)
        ) {
            return old;
        }

        return {
            ...old,
            colorString: settings.store.primaryColor || old?.colorString,
            colorStrings: {
                primaryColor: settings.store.primaryColor || old?.colorStrings?.primaryColor,
                secondaryColor: settings.store.secondaryColor || old?.colorStrings?.secondaryColor,
                tertiaryColor: settings.store.tertiaryColor || old?.colorStrings?.tertiaryColor,
            }
        };
    },

    getColors(user: any, colorString: string, old: any) {
        if (user.id !== Common.UserStore.getCurrentUser().id || settings.store.dmsOnly) {
            return {
                colorString,
                roleColorStrings: old
            };
        }

        return {
            colorString: settings.store.primaryColor || colorString,
            roleColorStrings: {
                primaryColor: settings.store.primaryColor || old?.primaryColor,
                secondaryColor: settings.store.secondaryColor || old?.secondaryColor,
                tertiaryColor: settings.store.tertiaryColor || old?.tertiaryColor,
            }
        };
    }
});
