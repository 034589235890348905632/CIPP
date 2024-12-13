import { DeveloperMode, FilterTiltShift, Sync, ViewColumn } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import { Box, Stack } from "@mui/system";
import { MRT_GlobalFilterTextField, MRT_ToggleFiltersButton } from "material-react-table";
import { PDFExportButton } from "../pdfExportButton";
import {
  ChevronDownIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { usePopover } from "../../hooks/use-popover";
import { CSVExportButton } from "../csvExportButton";
import { useDialog } from "../../hooks/use-dialog";
import { useEffect, useState } from "react";
import { CippApiDialog } from "../CippComponents/CippApiDialog";
import { getCippTranslation } from "../../utils/get-cipp-translation";
import { useSettings } from "../../hooks/use-settings";
import { useRouter } from "next/router";
import { CippOffCanvas } from "../CippComponents/CippOffCanvas";
import { CippCodeBlock } from "../CippComponents/CippCodeBlock";

export const CIPPTableToptoolbar = ({
  table,
  getRequestData,
  usedColumns,
  usedData,
  columnVisibility,
  setColumnVisibility,
  title,
  actions,
  filters,
  exportEnabled,
  refreshFunction,
  queryKeys,
}) => {
  const popover = usePopover();
  const columnPopover = usePopover();
  const filterPopover = usePopover();

  const settings = useSettings();
  const router = useRouter();
  const createDialog = useDialog();
  const [actionData, setActionData] = useState({ data: {}, action: {}, ready: false });
  const [offcanvasVisible, setOffcanvasVisible] = useState(false);

  const pageName = router.asPath.split("/").slice(1).join("/");

  //useEffect to set the column visibility to the preferred columns if they exist
  useEffect(() => {
    if (settings?.columnDefaults?.[pageName]) {
      setColumnVisibility(settings?.columnDefaults?.[pageName]);
    }
  }, [settings?.columnDefaults?.[pageName], router, usedColumns]);

  const resetToDefaultVisibility = () => {
    settings.handleUpdate({
      columnDefaults: {
        ...settings?.columnDefaults,
        [pageName]: false,
      },
    });
    //reload the page to reset the columns, use next shallow routing to prevent full page reload
    router.replace(router.asPath, undefined, { shallow: true });
  };

  const resetToPreferedVisibility = () => {
    if (settings?.columnDefaults[pageName]) {
      setColumnVisibility(settings?.columnDefaults[pageName]);
    }
  };

  const saveAsPreferedColumns = () => {
    settings.handleUpdate({
      columnDefaults: {
        ...settings?.columnDefaults,
        [pageName]: columnVisibility,
      },
    });
  };

  const setTableFilter = (filter, filterType) => {
    if (filterType === "global" || filterType === undefined) {
      table.setGlobalFilter(filter);
    }
    if (filterType === "column") {
      table.setShowColumnFilters(true);
      table.setColumnFilters(filter);
    }
    if (filterType === "reset") {
      table.resetGlobalFilter();
      table.resetColumnFilters();
    }
  };
  return (
    <>
      <Box
        sx={(theme) => ({
          display: "flex",
          gap: "0.5rem",
          p: "8px",
          justifyContent: "space-between",
        })}
      >
        <Box sx={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <>
            <Tooltip
              title={
                getRequestData?.isFetchNextPageError
                  ? "Could not retrieve all data. Click to try again."
                  : getRequestData?.isFetching
                  ? "Retrieving more data..."
                  : "Refresh data"
              }
            >
              <div
                onClick={() => {
                  if (typeof refreshFunction === "object") {
                    refreshFunction.refetch();
                  } else if (typeof refreshFunction === "function") {
                    refreshFunction();
                  } else if (getRequestData) {
                    getRequestData.refetch();
                  }
                }}
              >
                <IconButton
                  className="MuiIconButton"
                  disabled={
                    getRequestData?.isLoading ||
                    getRequestData?.isFetching ||
                    refreshFunction?.isFetching
                  }
                >
                  <SvgIcon
                    fontSize="small"
                    sx={{
                      animation:
                        getRequestData?.isFetching || refreshFunction?.isFetching
                          ? "spin 1s linear infinite"
                          : "none",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  >
                    {getRequestData?.isFetchNextPageError ? (
                      <ExclamationCircleIcon color="red" />
                    ) : (
                      <Sync />
                    )}
                  </SvgIcon>
                </IconButton>
              </div>
            </Tooltip>

            <MRT_GlobalFilterTextField table={table} />
            <Tooltip title="Preset Filters">
              <IconButton onClick={filterPopover.handleOpen} ref={filterPopover.anchorRef}>
                <SvgIcon>
                  <MagnifyingGlassIcon />
                </SvgIcon>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={filterPopover.anchorRef.current}
              open={filterPopover.open}
              onClose={filterPopover.handleClose}
              MenuListProps={{ dense: true }}
            >
              <MenuItem onClick={() => setTableFilter("", "reset")}>
                <ListItemText primary="Reset all filters" />
              </MenuItem>
              {filters?.map((filter) => (
                <MenuItem key={filter.id} onClick={() => setTableFilter(filter.value, filter.type)}>
                  <ListItemText primary={filter.filterName} />
                </MenuItem>
              ))}
            </Menu>
            <MRT_ToggleFiltersButton table={table} />
            <Tooltip title="Toggle Column Visibility">
              <IconButton onClick={columnPopover.handleOpen} ref={columnPopover.anchorRef}>
                <ViewColumn />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={columnPopover.anchorRef.current}
              open={columnPopover.open}
              onClose={columnPopover.handleClose}
              MenuListProps={{ dense: true }}
            >
              <MenuItem onClick={resetToPreferedVisibility}>
                <ListItemText primary="Reset to preferred columns" />
              </MenuItem>
              <MenuItem onClick={saveAsPreferedColumns}>
                <ListItemText primary="Save as preferred columns" />
              </MenuItem>
              <MenuItem onClick={resetToDefaultVisibility}>
                <ListItemText primary="Delete preferred columns" />
              </MenuItem>
              {table
                .getAllColumns()
                .filter((column) => !column.id.startsWith("mrt-"))
                .map((column) => (
                  <MenuItem
                    key={column.id}
                    onClick={() =>
                      setColumnVisibility({
                        ...columnVisibility,
                        [column.id]: !column.getIsVisible(),
                      })
                    }
                  >
                    <Checkbox checked={column.getIsVisible()} />
                    <ListItemText primary={getCippTranslation(column.id)} />
                  </MenuItem>
                ))}
            </Menu>
            {exportEnabled && (
              <>
                <PDFExportButton
                  rows={table.getFilteredRowModel().rows}
                  columns={usedColumns}
                  reportName={title}
                  columnVisibility={columnVisibility}
                />
                <CSVExportButton
                  reportName={title}
                  columnVisibility={columnVisibility}
                  rows={table.getFilteredRowModel().rows}
                  columns={usedColumns}
                />
              </>
            )}
            <Tooltip title="View API Response">
              <IconButton onClick={() => setOffcanvasVisible(true)}>
                <DeveloperMode />
              </IconButton>
            </Tooltip>
            <CippOffCanvas
              size="xl"
              title="API Response"
              visible={offcanvasVisible}
              onClose={() => {
                setOffcanvasVisible(false);
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h4">API Response</Typography>
                <CippCodeBlock
                  type="editor"
                  code={JSON.stringify(usedData, null, 2)}
                  editorHeight="1000px"
                />
              </Stack>
            </CippOffCanvas>
          </>
        </Box>
        <Box>
          <Box sx={{ display: "flex", gap: "0.5rem" }}>
            {actions && (table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && (
              <>
                <Button
                  onClick={popover.handleOpen}
                  ref={popover.anchorRef}
                  startIcon={
                    <SvgIcon fontSize="small">
                      <ChevronDownIcon />
                    </SvgIcon>
                  }
                  variant="outlined"
                  sx={{
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  Bulk Actions
                </Button>
                <Menu
                  anchorEl={popover.anchorRef.current}
                  anchorOrigin={{
                    horizontal: "right",
                    vertical: "bottom",
                  }}
                  MenuListProps={{
                    dense: true,
                    sx: { p: 1 },
                  }}
                  onClose={popover.handleClose}
                  open={popover.open}
                  transformOrigin={{
                    horizontal: "right",
                    vertical: "top",
                  }}
                >
                  {actions
                    ?.filter((action) => !action.link)
                    .map((action, index) => (
                      <MenuItem
                        key={index}
                        onClick={() => {
                          setActionData({
                            data: table.getSelectedRowModel().rows.map((row) => row.original),
                            action: action,
                            ready: true,
                          });

                          if (action?.noConfirm && action.customFunction) {
                            table
                              .getSelectedRowModel()
                              .rows.map((row) =>
                                action.customFunction(row.original.original, action, {})
                              );
                          } else {
                            createDialog.handleOpen();
                            popover.handleClose();
                          }
                        }}
                      >
                        <SvgIcon fontSize="small" sx={{ minWidth: "30px" }}>
                          {action.icon}
                        </SvgIcon>
                        <ListItemText>{action.label}</ListItemText>
                      </MenuItem>
                    ))}
                </Menu>
              </>
            )}
          </Box>
        </Box>
      </Box>
      <Box>
        {actionData.ready && (
          <CippApiDialog
            createDialog={createDialog}
            title="Confirmation"
            fields={actionData.action?.fields}
            api={actionData.action}
            row={actionData.data}
            relatedQueryKeys={queryKeys}
          />
        )}
      </Box>
    </>
  );
};
