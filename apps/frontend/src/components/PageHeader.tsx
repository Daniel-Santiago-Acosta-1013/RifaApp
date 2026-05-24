import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

const PageHeader = ({ eyebrow, title, subtitle, actions }: PageHeaderProps) => (
  <Stack spacing={1.5}>
    {eyebrow && (
      <Typography variant="overline" sx={{ letterSpacing: "0.12em", color: "text.secondary" }}>
        {eyebrow}
      </Typography>
    )}
    <Typography variant="h4">{title}</Typography>
    {subtitle && (
      <Typography variant="subtitle1" color="text.secondary">
        {subtitle}
      </Typography>
    )}
    {actions && <Box sx={{ pt: 1 }}>{actions}</Box>}
  </Stack>
);

export default PageHeader;
