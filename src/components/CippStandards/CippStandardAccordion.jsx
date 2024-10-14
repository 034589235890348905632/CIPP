import {
  Card,
  Stack,
  Avatar,
  Box,
  Typography,
  IconButton,
  SvgIcon,
  Collapse,
  Divider,
  Grid,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, Delete, Add, Public, TableChart } from "@mui/icons-material";
import CippFormComponent from "/src/components/CippComponents/CippFormComponent";
import { useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import _ from "lodash";
import Microsoft from "../../icons/iconly/bulk/microsoft";
import Azure from "../../icons/iconly/bulk/azure";
import Exchange from "../../icons/iconly/bulk/exchange";
import Defender from "../../icons/iconly/bulk/defender";
import Intune from "../../icons/iconly/bulk/intune";

const CippStandardAccordion = ({
  standards,
  selectedStandards,
  expanded,
  handleAccordionToggle,
  handleRemoveStandard,
  handleAddMultipleStandard,
  formControl,
}) => {
  const [configuredState, setConfiguredState] = useState({});

  const watchedValues = useWatch({
    control: formControl.control,
  });

  useEffect(() => {
    Object.keys(selectedStandards).forEach((standardName) => {
      const standard = standards.find((s) => s.name === standardName.split("[")[0]);
      if (standard) {
        const actionFilled = !!_.get(watchedValues, `${standardName}.action`);
        const addedComponentsFilled =
          standard.addedComponent?.every(
            (component) => !!_.get(watchedValues, `${standardName}.${component.name}`)
          ) ?? true;

        const isConfigured = actionFilled && addedComponentsFilled;
        setConfiguredState((prevState) => ({
          ...prevState,
          [standardName]: isConfigured,
        }));
      }
    });
  }, [watchedValues, standards, selectedStandards]);

  const getAvailableActions = (disabledFeatures) => {
    const allActions = [
      { label: "Report", value: "Report" },
      { label: "Alert", value: "warn" },
      { label: "Remediate", value: "Remediate" },
    ];
    return allActions.filter((action) => !disabledFeatures?.[action.value.toLowerCase()]);
  };
  return Object.keys(selectedStandards).map((standardName) => {
    const standard = standards.find((s) => s.name === standardName.split("[")[0]);

    if (!standard) return null;

    const isExpanded = expanded === standardName;
    const hasAddedComponents = standard.addedComponent && standard.addedComponent.length > 0;
    const isConfigured = configuredState[standardName];

    const disabledFeatures = standard.disabledFeatures || {};

    const selectedTemplateName = standard.multiple
      ? _.get(watchedValues, `${standardName}.${standard.addedComponent?.[0]?.name}`)
      : "";
    const accordionTitle = selectedTemplateName
      ? `${standard.label} - ${selectedTemplateName.label}`
      : standard.label;

    return (
      <Card key={standardName} sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar>
              {standard.cat === "Global Standards" ? (
                <Public />
              ) : standard.cat === "Entra (AAD) Standards" ? (
                <Azure />
              ) : standard.cat === "Exchange Standards" ? (
                <Exchange />
              ) : standard.cat === "Defender Standards" ? (
                <Defender />
              ) : standard.cat === "Intune Standards" ? (
                <Intune />
              ) : (
                <Microsoft />
              )}
            </Avatar>
            <Box>
              <Typography variant="h6">{accordionTitle}</Typography> {/* Dynamic title */}
              <Typography variant="body2" color="textSecondary">
                {standard.helpText}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                backgroundColor: isConfigured ? "success.main" : "warning.main",
                borderRadius: "50%",
                width: 8,
                height: 8,
              }}
            />
            <Typography variant="body2">{isConfigured ? "Configured" : "Unconfigured"}</Typography>
            <IconButton color="error" onClick={() => handleRemoveStandard(standardName)}>
              <Delete />
            </IconButton>
            {standard.multiple && (
              <IconButton onClick={() => handleAddMultipleStandard(standardName)}>
                <SvgIcon component={Add} />
              </IconButton>
            )}

            <IconButton onClick={() => handleAccordionToggle(standardName)}>
              <SvgIcon
                component={ExpandMoreIcon}
                sx={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}
              />
            </IconButton>
          </Stack>
        </Stack>

        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {/* First Row - Dynamic Action Autocomplete with disabled features logic */}
              <Grid item xs={4}>
                <CippFormComponent
                  type="autoComplete"
                  name={`${standardName}.action`}
                  formControl={formControl}
                  label="Action"
                  options={getAvailableActions(disabledFeatures)}
                  fullWidth
                />
              </Grid>

              {/* Second Row - Added Components (null-safe) */}
              {hasAddedComponents && (
                <Grid item xs={8}>
                  <Grid container spacing={2}>
                    {standard.addedComponent.map((component, idx) => (
                      <Grid key={idx} item xs={12}>
                        <CippFormComponent
                          type={component.type}
                          label={component.label}
                          formControl={formControl}
                          {...component}
                          name={`${standardName}.${component.name}`}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Box>
        </Collapse>
      </Card>
    );
  });
};

export default CippStandardAccordion;
