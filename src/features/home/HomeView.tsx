"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import { homeItems } from "./mocks/home";

export function HomeView() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box component="main" sx={{ minHeight: "100dvh", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="md">
        <Stack spacing={{ xs: 2, sm: 3 }}>
          <Stack spacing={1}>
            <Chip label="Entorno de validación" size="small" sx={{ alignSelf: "flex-start" }} />
            <Typography component="h1" variant="h3">
              XtraCash
            </Typography>
            <Typography color="text.secondary">
              Pantalla temporal para comprobar Material UI y el comportamiento responsive.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 2fr) minmax(0, 1fr)" },
            }}
          >
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography component="h2" variant="h6">
                    Integración lista
                  </Typography>
                  <Typography color="text.secondary">
                    {isExpanded
                      ? "El tema, los componentes responsive y el estado local funcionan en conjunto."
                      : "Usa el botón para validar una interacción en memoria."}
                  </Typography>
                  <Button
                    onClick={() => setIsExpanded((current) => !current)}
                    variant="contained"
                  >
                    {isExpanded ? "Mostrar menos" : "Mostrar más"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography component="h2" variant="h6">
                  Comprobaciones
                </Typography>
                <List disablePadding>
                  {homeItems.map((item) => (
                    <ListItem disableGutters key={item.id}>
                      <ListItemText primary={item.label} secondary={item.detail} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
